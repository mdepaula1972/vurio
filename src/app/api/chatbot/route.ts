import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { geminiModel } from "@/lib/gemini";
import { SchemaType } from "@google/generative-ai";

interface ExtractedData {
  cpf?: string | null;
  name?: string | null;
  tableNumber?: string | null;
  orderItems?: Array<{
    produtoId: string;
    quantidade: number;
    instrucoesEspeciais?: string | null;
  }> | null;
  orderConfirmed?: boolean;
}

export async function POST(request: Request) {
  try {
    const { sessionId, userMessage } = await request.json();

    if (!sessionId || !userMessage) {
      return NextResponse.json(
        { error: "sessionId e userMessage são obrigatórios." },
        { status: 400 }
      );
    }

    // 1. Obter a sessão de chat
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessoes_chat")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Sessão de chat não encontrada." },
        { status: 404 }
      );
    }

    // 2. Salvar a mensagem do usuário no banco
    await supabaseAdmin.from("mensagens_chat").insert({
      sessao_id: sessionId,
      role: "user",
      conteudo: userMessage,
    });

    // 3. Obter produtos disponíveis (Módulo de Estoque - D025)
    const { data: products } = await supabaseAdmin
      .from("produtos")
      .select("*")
      .eq("estabelecimento_id", session.estabelecimento_id)
      .eq("disponivel", true);

    const availableProducts = (products || []).filter(
      (p) => !p.gerenciar_estoque || p.quantidade_estoque > 0
    );

    // 4. Obter histórico de mensagens (últimas 20 para contexto)
    const { data: history } = await supabaseAdmin
      .from("mensagens_chat")
      .select("role, conteudo")
      .eq("sessao_id", sessionId)
      .order("criado_em", { ascending: true })
      .limit(20);

    // 5. Prompt de Sistema do Chatbot
    const menuFormatted = availableProducts
      .map((p) => `- ${p.nome} (Ref ID: ${p.id}): R$ ${p.preco} ${p.descricao ? `(${p.descricao})` : ""}`)
      .join("\n");

    const systemPrompt = `Você é o "Vurio", um assistente de atendimento caloroso e simpático de um bar/restaurante.
Seu tom é o de um garçom antigo de bairro que já conhece o cliente pelo nome, amigável e atencioso.

Contexto da Sessão:
- Identificação Atual: ${session.cliente_cpf ? `Cliente identificado (CPF ${session.cliente_cpf})` : "Cliente NÃO identificado"}
- Mesa Atual: ${session.numero_mesa ? `Mesa ${session.numero_mesa}` : "Não informada"}

Cardápio Disponível em Estoque:
${menuFormatted || "Não há itens disponíveis no momento."}

Instruções Operacionais:
1. Se o cliente não estiver identificado, peça educadamente o nome e o CPF para abrir a comanda.
2. Apresente as opções do cardápio e ajude o cliente a montar o pedido.
3. Se o cliente pedir bebida alcoólica pela primeira vez, peça confirmação de que é maior de 18 anos.
4. Quando o cliente decidir finalizar, liste os itens e quantidades e peça confirmação explícita.
5. Se ele mudar de mesa, anote o novo número.`;

    // 6. Configurar conversa usando o SDK do Gemini (gemini-2.5-flash)
    const chat = geminiModel.startChat({
      history: (history || [])
        .filter((h) => h.role === "user" || h.role === "assistant")
        .map((h) => ({
          role: h.role === "assistant" ? ("model" as const) : ("user" as const),
          parts: [{ text: h.conteudo }],
        })),
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(userMessage);
    let botResponse = result.response.text() || "";

    // 7. Extração de Dados Estruturados usando JSON Schema Nativo do Gemini
    const extractionPrompt = `Analise a mensagem do usuário e extraia os dados estruturados do pedido e contexto.

Cardápio de Referência (IDs válidos de produtos):
${JSON.stringify(availableProducts.map((p) => ({ id: p.id, nome: p.nome })))}

Mensagem do usuário: "${userMessage}"`;

    const extractionResult = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            cpf: { type: SchemaType.STRING, description: "CPF contendo apenas 11 dígitos ou null" },
            name: { type: SchemaType.STRING, description: "Nome do cliente ou null" },
            tableNumber: { type: SchemaType.STRING, description: "Número da mesa ou null" },
            orderItems: {
              type: SchemaType.ARRAY,
              description: "Itens a pedir",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  produtoId: { type: SchemaType.STRING, description: "ID do produto" },
                  quantidade: { type: SchemaType.INTEGER, description: "Quantidade" },
                  instrucoesEspeciais: { type: SchemaType.STRING, description: "Observações especiais" }
                },
                required: ["produtoId", "quantidade"]
              }
            },
            orderConfirmed: { type: SchemaType.BOOLEAN, description: "true se confirmou fechamento do pedido" }
          }
        }
      }
    });

    const extractedText = extractionResult.response.text() || "{}";
    let extracted: ExtractedData = {};
    try {
      extracted = JSON.parse(extractedText);
    } catch (e) {
      console.error("[Chatbot] JSON extraction parsing failed:", e);
    }

    // 8. Atualizar sessão com mesa ou CPF se extraídos
    const updates: Record<string, any> = {};
    if (extracted.tableNumber) {
      updates.numero_mesa = extracted.tableNumber;
    }
    if (extracted.cpf && extracted.cpf.replace(/\D/g, "").length === 11) {
      updates.cliente_cpf = extracted.cpf.replace(/\D/g, "");
      updates.status = "active";
    }

    if (Object.keys(updates).length > 0) {
      await supabaseAdmin
        .from("sessoes_chat")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    }

    // 9. Se o pedido foi confirmado, criar o pedido no banco
    if (extracted.orderConfirmed && extracted.orderItems && extracted.orderItems.length > 0) {
      const activeCpf = session.cliente_cpf || updates.cliente_cpf;
      const activeMesa = session.numero_mesa || extracted.tableNumber;

      if (!activeCpf) {
        botResponse = "Ah, antes de mandar seu pedido para a cozinha, preciso que você confirme seu nome e CPF no formulário ali embaixo. É rapidinho!";
      } else {
        // Obter ou criar sessão de mesa (D005 / D011)
        let sessaoMesaId = null;
        if (activeMesa) {
          const { data: existingMesa } = await supabaseAdmin
            .from("sessoes_mesa")
            .select("id")
            .eq("estabelecimento_id", session.estabelecimento_id)
            .eq("identificador_mesa", activeMesa)
            .eq("status", "aberta")
            .maybeSingle();

          if (existingMesa) {
            sessaoMesaId = existingMesa.id;
          } else {
            const { data: newMesa } = await supabaseAdmin
              .from("sessoes_mesa")
              .insert({
                estabelecimento_id: session.estabelecimento_id,
                identificador_mesa: activeMesa,
                status: "aberta",
              })
              .select("id")
              .single();
            if (newMesa) sessaoMesaId = newMesa.id;
          }

          // Vincular cliente à sessão de mesa
          if (sessaoMesaId) {
            const { data: activeLink } = await supabaseAdmin
              .from("sessao_mesa_clientes")
              .select("id")
              .eq("sessao_id", sessaoMesaId)
              .eq("cliente_cpf", activeCpf)
              .is("saiu_em", null);

            if (!activeLink || activeLink.length === 0) {
              await supabaseAdmin.from("sessao_mesa_clientes").insert({
                sessao_id: sessaoMesaId,
                cliente_cpf: activeCpf,
              });
            }
          }
        }

        // Criar Pedido Principal
        const { data: order, error: orderCreateError } = await supabaseAdmin
          .from("pedidos")
          .insert({
            estabelecimento_id: session.estabelecimento_id,
            cliente_cpf: activeCpf,
            sessao_mesa_id: sessaoMesaId,
            numero_mesa_estatico: activeMesa || null,
            status: "recebido",
          })
          .select("id")
          .single();

        if (orderCreateError || !order) {
          console.error("[Chatbot] Order creation failed:", orderCreateError);
          botResponse = "Ops, deu um pequeno erro ao registrar seu pedido. Pode tentar novamente?";
        } else {
          // Criar itens do pedido com preço travado no checkout (D018)
          let itemsSummary = "";
          let totalOrder = 0;

          for (const item of extracted.orderItems) {
            const matchedProduct = availableProducts.find((p) => p.id === item.produtoId);
            if (matchedProduct) {
              const priceHistorico = parseFloat(matchedProduct.preco);
              const totalItem = priceHistorico * item.quantidade;
              totalOrder += totalItem;

              await supabaseAdmin.from("itens_pedido").insert({
                pedido_id: order.id,
                produto_id: item.produtoId,
                quantidade: item.quantidade,
                preco_historico: priceHistorico,
                instrucoes_especiais: item.instrucoesEspeciais || null,
                status: "pendente",
              });

              itemsSummary += `\n- ${item.quantidade}x ${matchedProduct.nome}: R$ ${totalItem.toFixed(2)}`;
            }
          }

          // Logar interação
          await supabaseAdmin.from("log_interacoes").insert({
            estabelecimento_id: session.estabelecimento_id,
            cliente_cpf: activeCpf,
            tipo_evento: "order_placed",
            dados_evento: { orderId: order.id, total: totalOrder },
          });

          botResponse = `✅ Perfeito! Seu pedido foi enviado para a cozinha.\n\nResumo do Pedido:${itemsSummary}\n\n**Total: R$ ${totalOrder.toFixed(2)}**\n\nJájá eu te aviso quando ficar pronto!`;
        }
      }
    }

    // Salvar a resposta do assistente no banco
    await supabaseAdmin.from("mensagens_chat").insert({
      sessao_id: sessionId,
      role: "assistant",
      conteudo: botResponse,
    });

    return NextResponse.json({
      response: botResponse,
      chatState: updates.status || session.status,
    });
  } catch (error) {
    console.error("[Chatbot API] Error:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar conversa." },
      { status: 500 }
    );
  }
}
