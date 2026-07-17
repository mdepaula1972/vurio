import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateCpf } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { sessionId, cpf, name, basicConsent, aggregatedConsent } = await request.json();

    if (!sessionId || !cpf || !name) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (sessionId, cpf, name)." },
        { status: 400 }
      );
    }

    // 1. Validação Matemática do CPF (D014 / R012)
    const cleanCpf = cpf.replace(/\D/g, "");
    if (!validateCpf(cleanCpf)) {
      return NextResponse.json(
        { error: "CPF inválido matemático. Verifique os dígitos." },
        { status: 400 }
      );
    }

    // 2. Gravar ou atualizar o cliente no Supabase (Auth + RLS Bypass)
    const { error: upsertError } = await supabaseAdmin
      .from("clientes")
      .upsert({
        cpf: cleanCpf,
        nome: name,
        consentimento_basico: basicConsent ?? true,
        consentimento_agregado: aggregatedConsent ?? false,
        atualizado_em: new Date().toISOString(),
      });

    if (upsertError) {
      console.error("[ConfirmIdentity] Error upserting client:", upsertError);
      return NextResponse.json(
        { error: "Erro ao salvar cadastro do cliente." },
        { status: 500 }
      );
    }

    // 3. Buscar sessão de chat para vincular o telefone se disponível
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

    // 4. Se a sessão tem telefone, registrar no histórico
    if (session.telefone) {
      const { data: activePhones } = await supabaseAdmin
        .from("historico_telefones")
        .select("*")
        .eq("cliente_cpf", cleanCpf)
        .eq("telefone", session.telefone)
        .is("data_fim", null);

      // Se o telefone não está associado ativamente, cria a associação
      if (!activePhones || activePhones.length === 0) {
        await supabaseAdmin.from("historico_telefones").insert({
          cliente_cpf: cleanCpf,
          telefone: session.telefone,
          data_inicio: new Date().toISOString(),
        });
      }
    }

    // 5. Atualizar a sessão do chat para ativa
    const { error: updateSessionError } = await supabaseAdmin
      .from("sessoes_chat")
      .update({
        cliente_cpf: cleanCpf,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateSessionError) {
      console.error("[ConfirmIdentity] Error updating session:", updateSessionError);
      return NextResponse.json(
        { error: "Erro ao ativar sessão do chat." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      client: {
        cpf: cleanCpf,
        name,
      },
    });
  } catch (error) {
    console.error("[ConfirmIdentity] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
