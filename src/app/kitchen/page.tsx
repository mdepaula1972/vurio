"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { APP_VERSION } from "@/lib/version";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Clock, Volume2, ShieldAlert } from "lucide-react";

interface OrderItemDisplay {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_historico: number;
  instrucoes_especiais: string | null;
  status: "pendente" | "preparando" | "pronto" | "entregue";
  produto_nome?: string;
}

interface OrderDisplay {
  id: string;
  cliente_cpf: string;
  cliente_nome?: string;
  numero_mesa_estatico: string | null;
  status: "recebido" | "preparando" | "entregue" | "cancelado";
  itens: OrderItemDisplay[];
  criado_em: string;
  estabelecimento_id: string;
}

export default function KitchenDisplayPage() {
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Extrair establishment (slug) da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("establishment");
    if (!slug) {
      setIsLoading(false);
      return;
    }

    const fetchEstablishment = async () => {
      const { data: est } = await supabase
        .from("estabelecimentos")
        .select("id")
        .eq("slug", slug)
        .single();
      if (est) {
        setEstablishmentId(est.id);
        
        // Carregar mapa de produtos
        const { data: prods } = await supabase
          .from("produtos")
          .select("id, nome")
          .eq("estabelecimento_id", est.id);
        
        if (prods) {
          const map: Record<string, string> = {};
          prods.forEach(p => { map[p.id] = p.nome; });
          setProductsMap(map);
        }
      }
    };
    fetchEstablishment();
  }, []);

  // Verificar PIN de Acesso Local (D015)
  useEffect(() => {
    if (!establishmentId) return;
    const savedPin = localStorage.getItem(`kitchen_auth_${establishmentId}`);
    if (savedPin === "1234") { // PIN padrão para o piloto
      setIsAuthenticated(true);
    }
  }, [establishmentId]);

  // Buscar pedidos em aberto e carregar nomes dos clientes
  const fetchOrders = async () => {
    if (!establishmentId) return;

    try {
      const { data: pedidosData, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          clientes (nome)
        `)
        .eq("estabelecimento_id", establishmentId)
        .not("status", "eq", "cancelado")
        .order("criado_em", { ascending: false });

      if (error) throw error;

      const formattedOrders: OrderDisplay[] = [];

      for (const p of (pedidosData || [])) {
        // Obter itens de cada pedido
        const { data: itensData } = await supabase
          .from("itens_pedido")
          .select("*")
          .eq("pedido_id", p.id);

        const items: OrderItemDisplay[] = (itensData || []).map(item => ({
          id: item.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_historico: parseFloat(item.preco_historico),
          instrucoes_especiais: item.instrucoes_especiais,
          status: item.status,
          produto_nome: productsMap[item.produto_id] || "Produto",
        }));

        // Só exibe pedidos que tenham algum item não entregue no painel
        if (items.some(i => i.status !== "entregue")) {
          formattedOrders.push({
            id: p.id,
            cliente_cpf: p.cliente_cpf,
            cliente_nome: p.clientes?.nome || "Cliente",
            numero_mesa_estatico: p.numero_mesa_estatico,
            status: p.status,
            itens: items,
            criado_em: p.criado_em,
            estabelecimento_id: p.estabelecimento_id,
          });
        }
      }

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Erro ao buscar pedidos na cozinha:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega pedidos ao autenticar
  useEffect(() => {
    if (isAuthenticated && establishmentId) {
      fetchOrders();
    }
  }, [isAuthenticated, establishmentId, productsMap]);

  // 3. Ouvinte de Pedidos em Tempo Real + Alerta Sonoro (D015)
  useEffect(() => {
    if (!isAuthenticated || !establishmentId) return;

    const channel = supabase
      .channel(`kitchen_realtime_${establishmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `estabelecimento_id=eq.${establishmentId}`,
        },
        (payload) => {
          // Play chime se for novo pedido
          if (payload.eventType === "INSERT") {
            playNewOrderChime();
          }
          fetchOrders();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "itens_pedido",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, establishmentId, productsMap]);

  const playNewOrderChime = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
      }
      audioRef.current.play();
    } catch (e) {
      console.warn("Bloqueio de autoplay do navegador impediu som.");
    }
  };

  // Validar PIN de Entrada
  const handlePinSubmit = () => {
    if (pinInput === "1234") { // PIN Padrão de Cozinha para testes
      localStorage.setItem(`kitchen_auth_${establishmentId}`, "1234");
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
      case "recebido":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "preparando":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "pronto":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "entregue":
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente": return "Pendente";
      case "preparando": return "Em Preparo";
      case "pronto": return "Pronto";
      case "entregue": return "Entregue";
      case "recebido": return "Recebido";
      default: return status;
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("itens_pedido")
        .update({
          status: newStatus,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", itemId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
    }
  };

  // Render da autenticação do PIN
  if (!isAuthenticated && establishmentId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
        <Card className="max-w-md w-full p-8 bg-slate-900 border-slate-800 text-center space-y-6">
          <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Acesso Restrito Cozinha</h2>
            <p className="text-xs text-slate-400">Insira o PIN operacional para visualizar os pedidos</p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Digite o PIN de 4 dígitos"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              className="text-center bg-slate-950 border-slate-800 text-white tracking-widest text-lg"
            />
            {pinError && <p className="text-xs text-red-500 font-medium">PIN incorreto. Tente novamente.</p>}
            <Button onClick={handlePinSubmit} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-950 font-semibold rounded-lg">
              Entrar no Painel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="animate-spin text-white h-8 w-8" />
      </div>
    );
  }

  if (!establishmentId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
        <Card className="max-w-md w-full p-8 bg-slate-900 border-slate-800 text-center space-y-4">
          <h2 className="text-xl font-bold text-red-500">Slug de Estabelecimento Inválido</h2>
          <p className="text-sm text-slate-400">Verifique a URL e tente novamente.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Painel de Preparo (Cozinha & Bar)</h1>
              <span className="text-xs bg-slate-900 text-slate-400 font-mono px-2.5 py-1 rounded border border-slate-800">
                {APP_VERSION}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Monitore e atualize o status dos pedidos em tempo real</p>
          </div>
          <Button onClick={playNewOrderChime} variant="outline" className="border-slate-800 hover:bg-slate-900 text-slate-400 gap-2">
            <Volume2 className="h-4 w-4" /> Testar Alerta Sonoro
          </Button>
        </div>

        {/* Lista de Pedidos */}
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-900 rounded-2xl">
            <p className="text-slate-500 text-lg">Nenhum pedido pendente de preparo ou entrega no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const minutesAgo = Math.floor((Date.now() - new Date(order.criado_em).getTime()) / 60000);
              
              return (
                <Card key={order.id} className="bg-slate-900 border-slate-800 flex flex-col justify-between overflow-hidden shadow-xl">
                  <div>
                    {/* Card Header */}
                    <CardHeader className="pb-4 bg-slate-900/50 border-b border-slate-800/40">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white text-base">Mesa: {order.numero_mesa_estatico || "S/M"}</CardTitle>
                          <p className="text-xs text-slate-400 mt-1 font-semibold">Cliente: {order.cliente_nome}</p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} font-semibold text-xs rounded-full px-2.5 py-0.5`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </CardHeader>

                    {/* Card Content */}
                    <CardContent className="space-y-4 pt-4">
                      <div className="space-y-3">
                        {order.itens.map((item) => (
                          <div key={item.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/50 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm text-white">
                                  {item.quantidade}x {item.produto_nome}
                                </p>
                                {item.instrucoes_especiais && (
                                  <p className="text-xs text-amber-500 font-medium mt-1">
                                    ⚠️ Obs: {item.instrucoes_especiais}
                                  </p>
                                )}
                              </div>
                              <Badge className={`${getStatusColor(item.status)} font-medium text-[10px] rounded-full`}>
                                {getStatusLabel(item.status)}
                              </Badge>
                            </div>

                            {/* Ações de Transição de Status */}
                            <div className="flex gap-2">
                              {item.status === "pendente" && (
                                <Button
                                  size="sm"
                                  className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                                  onClick={() => handleUpdateItemStatus(item.id, "preparando")}
                                >
                                  <Clock className="h-3 w-3 mr-1.5" /> Começar
                                </Button>
                              )}
                              {item.status === "preparando" && (
                                <Button
                                  size="sm"
                                  className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg"
                                  onClick={() => handleUpdateItemStatus(item.id, "pronto")}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1.5" /> Pronto
                                </Button>
                              )}
                              {item.status === "pronto" && (
                                <Button
                                  size="sm"
                                  className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-lg"
                                  onClick={() => handleUpdateItemStatus(item.id, "entregue")}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1.5" /> Entregar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-3 bg-slate-950 border-t border-slate-900 text-slate-500 font-semibold text-[10px] flex items-center justify-between">
                    <span>Pedido #{order.id.slice(0, 8)}</span>
                    <span className={minutesAgo > 15 ? "text-red-400 font-bold" : ""}>
                      {minutesAgo} min atrás
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
