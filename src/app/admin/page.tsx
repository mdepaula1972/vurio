"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { APP_VERSION, LAST_UPDATED } from "@/lib/version";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { QrCode, Plus, Edit2, Trash2, Loader2, LogOut, Package, AlertTriangle, RefreshCw } from "lucide-react";

interface MenuCategory {
  id: string;
  name: string;
  ordem: number;
}

interface MenuItem {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  disponivel: boolean;
  categoria_id: string;
  gerenciar_estoque: boolean;
  quantidade_estoque: number;
  limite_alerta_estoque: number;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<any>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  
  // States para Formulários
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemData, setNewItemData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoria_id: "",
    gerenciar_estoque: false,
    quantidade_estoque: "10",
    limite_alerta_estoque: "3"
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);

  // 1. Escutar Estado de Autenticação do Supabase (D024)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Buscar Estabelecimentos do Dono Logado
  useEffect(() => {
    if (!user) return;

    const fetchEstablishments = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("estabelecimentos")
          .select("*")
          .eq("dono_id", user.id);

        if (error) throw error;
        
        setEstablishments(data || []);
        if (data && data.length > 0) {
          setSelectedEstablishment(data[0]);
        }
      } catch (error) {
        console.error("Erro ao carregar estabelecimentos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstablishments();
  }, [user]);

  // 3. Buscar categorias, produtos e alertas de estoque baixo
  const fetchMenuData = async () => {
    if (!selectedEstablishment) return;
    setIsLoadingMenu(true);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        supabase
          .from("categorias_cardapio")
          .select("*")
          .eq("estabelecimento_id", selectedEstablishment.id)
          .order("ordem"),
        supabase
          .from("produtos")
          .select("*")
          .eq("estabelecimento_id", selectedEstablishment.id)
          .order("ordem")
      ]);

      if (catsRes.error) throw catsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setCategories(catsRes.data || []);
      setItems((itemsRes.data || []).map(i => ({
        id: i.id,
        nome: i.nome,
        descricao: i.descricao,
        preco: parseFloat(i.preco),
        disponivel: i.disponivel,
        categoria_id: i.categoria_id,
        gerenciar_estoque: i.gerenciar_estoque,
        quantidade_estoque: i.quantidade_estoque,
        limite_alerta_estoque: i.limite_alerta_estoque
      })));
    } catch (error) {
      console.error("Erro ao carregar menu:", error);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, [selectedEstablishment]);

  // 4. Fluxo de Login Social e Email
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthErrorMessage(null);
    setAuthSuccessMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: emailInput,
          password: passwordInput
        });
        if (error) throw error;
        setAuthSuccessMessage("Conta de teste criada com sucesso! Agora clique em 'Entrar com Email'.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: passwordInput
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("[Auth Error]:", error);
      let msg = error.message || "Erro na autenticação.";
      if (msg.includes("Invalid login credentials")) {
        msg = "Credenciais inválidas. Se você ainda não criou uma conta com este email, clique no link abaixo para se Cadastrar.";
      } else if (msg.includes("rate limit")) {
        msg = "Limite de cadastros por hora atingido no Supabase. Tente novamente em alguns minutos ou use um email existente.";
      }
      setAuthErrorMessage(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/admin`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message || "Erro no login social.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 5. CRUD de Categorias
  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !selectedEstablishment) return;

    try {
      const { error } = await supabase.from("categorias_cardapio").insert({
        estabelecimento_id: selectedEstablishment.id,
        name: newCategoryName,
        ordem: categories.length
      });

      if (error) throw error;
      setNewCategoryName("");
      fetchMenuData();
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
    }
  };

  // 6. CRUD de Produtos e Módulo de Estoque (D025)
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.nome || !newItemData.preco || !newItemData.categoria_id || !selectedEstablishment) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const { error } = await supabase.from("produtos").insert({
        estabelecimento_id: selectedEstablishment.id,
        categoria_id: newItemData.categoria_id,
        nome: newItemData.nome,
        descricao: newItemData.descricao || null,
        preco: parseFloat(newItemData.preco),
        gerenciar_estoque: newItemData.gerenciar_estoque,
        quantidade_estoque: newItemData.gerenciar_estoque ? parseInt(newItemData.quantidade_estoque) : 0,
        limite_alerta_estoque: newItemData.gerenciar_estoque ? parseInt(newItemData.limite_alerta_estoque) : 3,
        disponivel: true
      });

      if (error) throw error;
      
      setNewItemData({
        nome: "",
        descricao: "",
        preco: "",
        categoria_id: "",
        gerenciar_estoque: false,
        quantidade_estoque: "10",
        limite_alerta_estoque: "3"
      });
      
      fetchMenuData();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
    }
  };

  const handleUpdateStock = async (itemId: string, currentStock: number, change: number) => {
    const newQty = currentStock + change;
    if (newQty < 0) return;

    try {
      // 1. Atualizar produto
      const { error: prodError } = await supabase
        .from("produtos")
        .update({ quantidade_estoque: newQty })
        .eq("id", itemId);

      if (prodError) throw prodError;

      // 2. Inserir log de transação de estoque para auditoria (D025)
      await supabase.from("transacoes_estoque").insert({
        estabelecimento_id: selectedEstablishment.id,
        produto_id: itemId,
        quantidade_alterada: change,
        tipo: "ajuste_manual",
        justificativa: "Ajuste manual de estoque no painel administrativo",
        usuario_admin_id: user.id
      });

      fetchMenuData();
    } catch (error) {
      console.error("Erro ao ajustar estoque:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto do cardápio?")) return;
    try {
      const { error } = await supabase.from("produtos").delete().eq("id", itemId);
      if (error) throw error;
      fetchMenuData();
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
    }
  };

  // Render Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-slate-800 h-8 w-8" />
      </div>
    );
  }

  // Render Login Screen if not authenticated (Supabase Auth - D024)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md p-8 shadow-xl bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Painel Vurio Admin</h1>
            <p className="text-xs text-slate-500">
              {isSignUp ? "Crie sua conta de administrador" : "Entre para gerenciar seu restaurante"}
            </p>
          </div>

          {authErrorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg leading-relaxed">
              ⚠️ {authErrorMessage}
            </div>
          )}

          {authSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-lg leading-relaxed font-medium">
              ✅ {authSuccessMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Email Administrativo</Label>
              <Input
                type="email"
                placeholder="nome@estabelecimento.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="mt-1 text-sm bg-slate-50 border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="mt-1 text-sm bg-slate-50 border-slate-200 rounded-lg"
              />
            </div>

            <Button disabled={authLoading} className="w-full bg-slate-950 hover:bg-slate-900 text-white rounded-lg py-2">
              {authLoading ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : isSignUp ? (
                "Criar Conta"
              ) : (
                "Entrar com Email"
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 underline"
            >
              {isSignUp ? "Já possui cadastro? Faça o Login" : "Não tem uma conta? Cadastre-se gratuitamente"}
            </button>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <span className="absolute px-3 bg-white text-[10px] uppercase font-bold text-slate-400">Ou entre com</span>
            <div className="w-full border-t border-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => handleOAuthLogin('google')} className="border-slate-200 rounded-lg text-slate-700">
              Google
            </Button>
            <Button variant="outline" onClick={() => handleOAuthLogin('facebook')} className="border-slate-200 rounded-lg text-slate-700">
              Facebook
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <span className="inline-block bg-slate-100 text-slate-600 text-[11px] font-mono font-medium px-2.5 py-1 rounded-md">
              Vurio System {APP_VERSION} — Atualizado: {LAST_UPDATED}
            </span>
          </div>
        </Card>
      </div>
    );
  }

  const activeQRUrl = selectedEstablishment 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/chat?establishment=${selectedEstablishment.slug}`)}`
    : "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vurio Painel Geral</h1>
            <p className="text-xs text-slate-500">Gestão e cardápio de restaurante</p>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-red-600 gap-2">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>

        {/* Seletor de Estabelecimentos */}
        <Card className="shadow-sm border-slate-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">Seus Estabelecimentos Parceiros</CardTitle>
          </CardHeader>
          <CardContent>
            {establishments.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum estabelecimento cadastrado para este dono.</p>
            ) : (
              <div className="flex gap-4">
                {establishments.map((est) => (
                  <Button
                    key={est.id}
                    variant={selectedEstablishment?.id === est.id ? "default" : "outline"}
                    onClick={() => setSelectedEstablishment(est)}
                    className="rounded-lg text-xs"
                  >
                    {est.name} ({est.slug})
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedEstablishment && (
          <Tabs defaultValue="menu" className="w-full">
            <TabsList className="bg-slate-200 p-1 rounded-xl">
              <TabsTrigger value="menu" className="rounded-lg text-xs font-semibold px-4 py-2">Cardápio & Estoque</TabsTrigger>
              <TabsTrigger value="qrcode" className="rounded-lg text-xs font-semibold px-4 py-2">QR Codes / Acesso</TabsTrigger>
            </TabsList>

            {/* TAB CARDÁPIO E ESTOQUE */}
            <TabsContent value="menu" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Criar Categorias e Itens */}
                <div className="space-y-6">
                  {/* Adicionar Categoria */}
                  <Card className="shadow-sm border-slate-200 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-sm">Nova Categoria de Menu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        placeholder="Ex: Bebidas Alcoólicas, Sobremesas"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="bg-slate-50 text-xs rounded-lg border-slate-200"
                      />
                      <Button onClick={handleAddCategory} className="w-full bg-slate-900 hover:bg-slate-800 text-xs text-white rounded-lg">
                        Adicionar Categoria
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Adicionar Produto */}
                  <Card className="shadow-sm border-slate-200 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-sm">Novo Item do Cardápio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddItem} className="space-y-3.5">
                        <div>
                          <Label className="text-[10px] font-bold text-slate-500">Nome do Produto *</Label>
                          <Input
                            placeholder="Ex: Hambúrguer Duplo"
                            value={newItemData.nome}
                            onChange={(e) => setNewItemData(prev => ({ ...prev, nome: e.target.value }))}
                            className="bg-slate-50 text-xs rounded-lg border-slate-200 mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-[10px] font-bold text-slate-500">Descrição</Label>
                          <Input
                            placeholder="Ex: Pão artesanal, dois blends de 150g"
                            value={newItemData.descricao}
                            onChange={(e) => setNewItemData(prev => ({ ...prev, descricao: e.target.value }))}
                            className="bg-slate-50 text-xs rounded-lg border-slate-200 mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[10px] font-bold text-slate-500">Preço (R$) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="39.90"
                              value={newItemData.preco}
                              onChange={(e) => setNewItemData(prev => ({ ...prev, preco: e.target.value }))}
                              className="bg-slate-50 text-xs rounded-lg border-slate-200 mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] font-bold text-slate-500">Categoria *</Label>
                            <select
                              value={newItemData.categoria_id}
                              onChange={(e) => setNewItemData(prev => ({ ...prev, categoria_id: e.target.value }))}
                              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none"
                            >
                              <option value="">Selecione...</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="gerenciar_estoque"
                              checked={newItemData.gerenciar_estoque}
                              onCheckedChange={(checked) =>
                                setNewItemData((prev) => ({ ...prev, gerenciar_estoque: checked === true }))
                              }
                            />
                            <Label htmlFor="gerenciar_estoque" className="text-xs font-semibold text-slate-600 cursor-pointer">
                              Controlar Estoque de Vendas?
                            </Label>
                          </div>

                          {newItemData.gerenciar_estoque && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-[10px] font-bold text-slate-500">Quantidade Atual</Label>
                                <Input
                                  type="number"
                                  value={newItemData.quantidade_estoque}
                                  onChange={(e) => setNewItemData(prev => ({ ...prev, quantidade_estoque: e.target.value }))}
                                  className="bg-slate-50 text-xs rounded-lg border-slate-200 mt-1"
                                />
                              </div>

                              <div>
                                <Label className="text-[10px] font-bold text-slate-500">Limite Alerta Mínimo</Label>
                                <Input
                                  type="number"
                                  value={newItemData.limite_alerta_estoque}
                                  onChange={(e) => setNewItemData(prev => ({ ...prev, limite_alerta_estoque: e.target.value }))}
                                  className="bg-slate-50 text-xs rounded-lg border-slate-200 mt-1"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-xs text-white rounded-lg">
                          Salvar Item
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {/* Listagem do Cardápio e Estoque (D025) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-800">Itens Ativos</h2>
                    <Button onClick={fetchMenuData} size="icon" variant="outline" className="h-8 w-8 rounded-lg">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {isLoadingMenu ? (
                    <div className="text-center py-10">
                      <Loader2 className="animate-spin mx-auto text-slate-600 h-6 w-6" />
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-10 bg-white border border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400">Nenhum produto cadastrado para este estabelecimento.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categories.map((cat) => {
                        const categoryItems = items.filter(i => i.categoria_id === cat.id);
                        if (categoryItems.length === 0) return null;

                        return (
                          <div key={cat.id} className="space-y-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cat.name}</h3>
                            <div className="grid grid-cols-1 gap-3">
                              {categoryItems.map((item) => {
                                const isLowStock = item.gerenciar_estoque && item.quantidade_estoque <= item.limite_alerta_estoque;
                                
                                return (
                                  <Card key={item.id} className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
                                    <div className="p-4 flex items-center justify-between gap-4">
                                      <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold text-sm text-slate-900">{item.nome}</h4>
                                          <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 rounded-full px-2">
                                            R$ {item.preco.toFixed(2)}
                                          </Badge>
                                          {isLowStock && (
                                            <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 border-none text-[9px] rounded-full flex items-center gap-1">
                                              <AlertTriangle className="h-3 w-3" /> Estoque Baixo
                                            </Badge>
                                          )}
                                        </div>
                                        {item.descricao && <p className="text-xs text-slate-400 leading-snug">{item.descricao}</p>}
                                      </div>

                                      {/* Seção Estoque Gerenciável */}
                                      <div className="flex items-center gap-4 border-l border-slate-100 pl-4">
                                        {item.gerenciar_estoque ? (
                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              className="h-6 w-6 rounded-md"
                                              onClick={() => handleUpdateStock(item.id, item.quantidade_estoque, -1)}
                                            >
                                              -
                                            </Button>
                                            <div className="text-center min-w-[32px]">
                                              <p className="text-xs font-bold text-slate-800">{item.quantidade_estoque}</p>
                                              <p className="text-[9px] text-slate-400 font-semibold uppercase">Qtd</p>
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              className="h-6 w-6 rounded-md"
                                              onClick={() => handleUpdateStock(item.id, item.quantidade_estoque, 1)}
                                            >
                                              +
                                            </Button>
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-slate-400 font-medium">Estoque Sem Controle</span>
                                        )}

                                        <Button
                                          onClick={() => handleDeleteItem(item.id)}
                                          size="icon"
                                          variant="ghost"
                                          className="text-slate-400 hover:text-red-500 h-8 w-8 rounded-lg"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB QR CODES */}
            <TabsContent value="qrcode" className="mt-4">
              <Card className="shadow-sm border-slate-200 rounded-xl max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-slate-800" />
                    Gerador de QR Code de Mesa
                  </CardTitle>
                  <CardDescription>Escaneie ou baixe o QR Code para abrir o chatbot</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  {activeQRUrl ? (
                    <div className="bg-slate-50 p-8 border border-slate-200 rounded-2xl inline-block shadow-inner">
                      <img src={activeQRUrl} alt="QR Code de atendimento" className="h-48 w-48 mx-auto" />
                      <p className="text-xs text-slate-500 mt-4 leading-relaxed max-w-xs mx-auto">
                        Cada mesa física pode usar o mesmo QR Code, pois a identificação e a divisão são rastreadas pelo CPF do cliente.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Carregando...</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
