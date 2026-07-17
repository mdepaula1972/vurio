"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type ChatState = "initial" | "identifying" | "collecting_consent" | "ordering" | "confirmed";

export default function ChatBotPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [chatState, setChatState] = useState<ChatState>("initial");
  const [identificationData, setIdentificationData] = useState<{
    name?: string;
    cpf?: string;
    basicConsent?: boolean;
    aggregatedConsent?: boolean;
  }>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Inicializar sessão de chat e buscar estabelecimento por slug
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("establishment");
    const phone = params.get("phone");

    if (!slug) {
      setPageLoading(false);
      return;
    }

    const initChat = async () => {
      try {
        // Buscar estabelecimento
        const { data: est, error: estError } = await supabase
          .from("estabelecimentos")
          .select("*")
          .eq("slug", slug)
          .single();

        if (estError || !est) {
          console.error("Estabelecimento não encontrado:", estError);
          setPageLoading(false);
          return;
        }

        setEstablishmentId(est.id);

        // Criar sessão de chat
        const { data: session, error: sessionError } = await supabase
          .from("sessoes_chat")
          .insert({
            estabelecimento_id: est.id,
            telefone: phone || null,
            status: "identifying",
          })
          .select("id")
          .single();

        if (sessionError || !session) {
          throw new Error("Erro ao criar sessão de chat.");
        }

        setSessionId(session.id);

        // Mensagem inicial de boas-vindas
        const initialMsg: Message = {
          id: "initial",
          role: "assistant",
          content:
            "Olá! Bem-vindo ao nosso estabelecimento. 👋 Para começar, preciso coletar algumas informações suas. Qual é o seu nome completo?",
        };
        setMessages([initialMsg]);
        setChatState("identifying");
      } catch (error) {
        console.error("Erro ao inicializar chat:", error);
      } finally {
        setPageLoading(false);
      }
    };

    initChat();
  }, []);

  // 2. Ouvinte de Mensagens em Tempo Real (Supabase Realtime)
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat_messages:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens_chat",
          filter: `sessao_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => {
            // Evitar duplicações
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                id: newMsg.id,
                role: newMsg.role,
                content: newMsg.conteudo,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Auto-scroll ao receber mensagens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 3. Enviar mensagem do usuário
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || isLoading) return;

    const userText = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      // Chamar endpoint de processamento da IA
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userMessage: userText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no processamento.");

      // Se mudou de estado no backend, atualiza o frontend
      if (data.chatState) {
        setChatState(data.chatState);
      }

      // Se estiver coletando identificação, abre o formulário de consentimento
      if (chatState === "identifying" && (userText.length > 5 || userText.match(/\d/))) {
        setChatState("collecting_consent");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Confirmar Identidade no Formulário e aceitar LGPD
  const handleConfirmIdentity = async () => {
    if (!identificationData.name || !identificationData.cpf || !sessionId) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/chatbot/confirm-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          cpf: identificationData.cpf,
          name: identificationData.name,
          basicConsent: identificationData.basicConsent ?? true,
          aggregatedConsent: identificationData.aggregatedConsent ?? false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao confirmar.");

      // Mensagem simulada de confirmação do garçom IA
      const confirmMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Perfeito! Bem-vindo, ${identificationData.name}! 🎉\n\nAgora vamos para o seu pedido. O que você gostaria de pedir do nosso cardápio?`,
      };

      setMessages((prev) => [...prev, confirmMsg]);
      setChatState("ordering");
      setIdentificationData({});
    } catch (error: any) {
      console.error("Erro na identificação:", error);
      alert(error.message || "Erro ao confirmar identidade. Verifique os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="p-8 shadow-lg max-w-md w-full flex items-center justify-center gap-2">
          <Loader2 className="animate-spin text-primary" />
          <span className="text-sm text-slate-500 font-medium">Carregando chat de atendimento...</span>
        </Card>
      </div>
    );
  }

  if (!establishmentId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <Card className="p-8 shadow-lg max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold text-red-600">URL Inválida</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Estabelecimento não identificado. Por favor, escaneie novamente o QR Code da sua mesa.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
          <div>
            <h1 className="text-lg font-semibold text-slate-900 leading-none">Garçom Digital Vurio</h1>
            <p className="text-xs text-slate-500 mt-1">Conectado em tempo real</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-slate-50">
        <div className="max-w-2xl mx-auto space-y-4 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                  message.role === "user"
                    ? "bg-slate-950 text-white rounded-tr-none"
                    : "bg-white text-slate-900 border border-slate-200 rounded-tl-none"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 shadow-md p-4 sticky bottom-0 z-10">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Formulário de Identificação / LGPD */}
          {chatState === "collecting_consent" && (
            <Card className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div>
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: João da Silva"
                  value={identificationData.name || ""}
                  onChange={(e) =>
                    setIdentificationData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 bg-white border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <Label htmlFor="cpf" className="text-xs font-semibold text-slate-700">
                  CPF (11 dígitos, apenas números) *
                </Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={identificationData.cpf || ""}
                  onChange={(e) =>
                    setIdentificationData((prev) => ({
                      ...prev,
                      cpf: e.target.value.replace(/\D/g, "").slice(0, 11),
                    }))
                  }
                  className="mt-1 bg-white border-slate-200 rounded-lg text-sm"
                  maxLength={11}
                />
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="basicConsent"
                    checked={identificationData.basicConsent ?? true}
                    onCheckedChange={(checked) =>
                      setIdentificationData((prev) => ({
                        ...prev,
                        basicConsent: checked === true,
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="basicConsent" className="text-xs text-slate-600 leading-snug cursor-pointer font-normal">
                    Autorizo a coleta e o processamento de meus dados para esta mesa e comanda. *
                  </Label>
                </div>

                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="aggregatedConsent"
                    checked={identificationData.aggregatedConsent ?? false}
                    onCheckedChange={(checked) =>
                      setIdentificationData((prev) => ({
                        ...prev,
                        aggregatedConsent: checked === true,
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="aggregatedConsent" className="text-xs text-slate-500 leading-snug cursor-pointer font-normal">
                    Autorizo o compartilhamento de histórico de preferências entre restaurantes da rede.
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleConfirmIdentity}
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm py-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando CPF...
                  </>
                ) : (
                  "Confirmar Cadastro"
                )}
              </Button>
            </Card>
          )}

          {/* Chat text box */}
          {chatState !== "collecting_consent" && (
            <div className="flex gap-2 items-center">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ex: Gostaria de pedir uma Coca-Cola..."
                disabled={isLoading}
                className="flex-1 bg-slate-50 border-slate-200 rounded-full px-4 py-2 text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="icon"
                className="rounded-full bg-slate-900 hover:bg-slate-800"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Send className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
