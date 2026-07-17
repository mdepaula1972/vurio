-- SUPABASE_SCHEMA.sql — Schema de Banco de Dados PostgreSQL para Supabase (Vurio)
-- Inclui Multi-tenancy, RLS (Row Level Security), Supabase Auth e Módulo de Estoque (D025)

-- Habilitar extensões necessárias
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. CLIENTES (Compartilhados, identificados por CPF)
-- ==========================================
create table public.clientes (
    cpf varchar(11) primary key,
    nome varchar(255) not null,
    consentimento_basico boolean not null default false,
    consentimento_agregado boolean not null default false,
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
    atualizado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. HISTÓRICO DE TELEFONES (Canal associado ao CPF)
-- ==========================================
create table public.historico_telefones (
    id uuid default gen_random_uuid() primary key,
    cliente_cpf varchar(11) not null references public.clientes(cpf) on delete cascade,
    telefone varchar(20) not null,
    data_inicio timestamp with time zone default timezone('utc'::text, now()) not null,
    data_fim timestamp with time zone,
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_telefones_ativo on public.historico_telefones(telefone) where data_fim is null;

-- ==========================================
-- 3. ESTABELECIMENTOS
-- ==========================================
create table public.estabelecimentos (
    id uuid default gen_random_uuid() primary key,
    nome varchar(255) not null,
    slug varchar(255) not null unique,
    dono_id uuid not null references auth.users(id) on delete cascade, -- Integrado ao Supabase Auth
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
    atualizado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_estabelecimentos_dono on public.estabelecimentos(dono_id);

-- ==========================================
-- 4. CATEGORIAS DO CARDÁPIO
-- ==========================================
create table public.categorias_cardapio (
    id uuid default gen_random_uuid() primary key,
    estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
    nome varchar(255) not null,
    ordem integer default 0 not null,
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_categorias_estabelecimento on public.categorias_cardapio(estabelecimento_id);

-- ==========================================
-- 5. PRODUTOS / ITENS DO CARDÁPIO (Com Módulo de Estoque - D025)
-- ==========================================
create table public.produtos (
    id uuid default gen_random_uuid() primary key,
    estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
    categoria_id uuid not null references public.categorias_cardapio(id) on delete cascade,
    nome varchar(255) not null,
    descricao text,
    preco decimal(10, 2) not null check (preco >= 0),
    disponivel boolean default true not null,
    imagem_url text,
    ordem integer default 0 not null,
    restricao_idade boolean default false not null, -- D021: Bebida alcoólica / restrição
    
    -- Campos do Módulo de Estoque (D025)
    gerenciar_estoque boolean default false not null,
    quantidade_estoque integer default 0 not null,
    limite_alerta_estoque integer default 5 not null,
    
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
    atualizado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_produtos_estabelecimento on public.produtos(estabelecimento_id);
create index idx_produtos_categoria on public.produtos(categoria_id);

-- ==========================================
-- 6. TRANSAÇÕES DE ESTOQUE (Auditoria de Movimentação - D025)
-- ==========================================
create table public.transacoes_estoque (
    id uuid default gen_random_uuid() primary key,
    estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
    produto_id uuid not null references public.produtos(id) on delete cascade,
    quantidade_alterada integer not null, -- negativo para saída/consumo, positivo para entrada
    tipo varchar(50) not null check (tipo in ('venda', 'ajuste_manual', 'desperdicio', 'reabastecimento')),
    justificativa text,
    usuario_admin_id uuid references auth.users(id), -- Quem realizou (se manual)
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_transacoes_produto on public.transacoes_estoque(produto_id);

-- ==========================================
-- 7. SESSÕES DE MESA (Agrupador Físico para Divisão de Conta - D005, D011)
-- ==========================================
create table public.sessoes_mesa (
    id uuid default gen_random_uuid() primary key,
    estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
    identificador_mesa varchar(50) not null, -- "Mesa 5", "Balcão"
    aberta_em timestamp with time zone default timezone('utc'::text, now()) not null,
    fechada_em timestamp with time zone,
    status varchar(20) default 'aberta' not null check (status in ('aberta', 'fechando', 'encerrada')),
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_sessoes_mesa_estabelecimento on public.sessoes_mesa(estabelecimento_id);

-- Tabela de junção para clientes presentes na mesa (D005)
create table public.sessao_mesa_clientes (
    id uuid default gen_random_uuid() primary key,
    sessao_id uuid not null references public.sessoes_mesa(id) on delete cascade,
    cliente_cpf varchar(11) not null references public.clientes(cpf) on delete cascade,
    entrou_em timestamp with time zone default timezone('utc'::text, now()) not null,
    saiu_em timestamp with time zone,
    unique(sessao_id, cliente_cpf, saiu_em)
);

-- ==========================================
-- 8. PEDIDOS (orders)
-- ==========================================
create table public.pedidos (
    id uuid default gen_random_uuid() primary key,
    estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
    cliente_cpf varchar(11) not null references public.clientes(cpf),
    sessao_mesa_id uuid references public.sessoes_mesa(id) on delete set null,
    numero_mesa_estatico varchar(50), -- cópia para histórico caso a sessão mude
    status varchar(30) default 'recebido' not null check (status in ('recebido', 'preparando', 'entregue', 'cancelado')),
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
    atualizado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_pedidos_estabelecimento on public.pedidos(estabelecimento_id);
create index idx_pedidos_cliente on public.pedidos(cliente_cpf);

-- ==========================================
-- 9. ITENS DO PEDIDO (orderItems)
-- ==========================================
create table public.itens_pedido (
    id uuid default gen_random_uuid() primary key,
    pedido_id uuid not null references public.pedidos(id) on delete cascade,
    produto_id uuid not null references public.produtos(id),
    quantidade integer default 1 not null check (quantidade > 0),
    preco_historico decimal(10, 2) not null, -- D018: Preço fixado no momento do pedido
    instrucoes_especiais text,
    status varchar(30) default 'pendente' not null check (status in ('pendente', 'preparando', 'pronto', 'entregue')),
    status_divisao varchar(30) default 'individual' not null check (status_divisao in ('individual', 'compartilhado_pendente', 'compartilhado_confirmado')),
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
    atualizado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_itens_pedido_ref on public.itens_pedido(pedido_id);

-- ==========================================
-- 10. DIVISÃO DE ITEM COMPARTILHADO (Rateio de Conta - D011, D012)
-- ==========================================
create table public.divisoes_itens (
    id uuid default gen_random_uuid() primary key,
    item_pedido_id uuid not null references public.itens_pedido(id) on delete cascade,
    cliente_cpf varchar(11) not null references public.clientes(cpf) on delete cascade,
    confirmado boolean default false not null,
    confirmado_em timestamp with time zone,
    valor_proporcional decimal(10, 2) not null,
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_divisoes_item on public.divisoes_itens(item_pedido_id);

-- ==========================================
-- 11. SESSÕES DE CHAT (Para o Chatbot de IA)
-- ==========================================
create table public.sessoes_chat (
    id uuid default gen_random_uuid() primary key,
    estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
    cliente_cpf varchar(11) references public.clientes(cpf) on delete set null,
    telefone varchar(20),
    numero_mesa varchar(50),
    status varchar(30) default 'identifying' not null check (status in ('identifying', 'active', 'closed')),
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
    atualizado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_sessoes_chat_estabelecimento on public.sessoes_chat(estabelecimento_id);

-- ==========================================
-- 12. MENSAGENS DE CHAT
-- ==========================================
create table public.mensagens_chat (
    id uuid default gen_random_uuid() primary key,
    sessao_id uuid not null references public.sessoes_chat(id) on delete cascade,
    role varchar(20) not null check (role in ('user', 'assistant', 'system')),
    conteudo text not null,
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_mensagens_sessao on public.mensagens_chat(sessao_id);

-- ==========================================
-- 13. LOG DE INTERAÇÕES (Log Bruto para Treinamento da IA - D020)
-- ==========================================
create table public.log_interacoes (
    id uuid default gen_random_uuid() primary key,
    estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
    cliente_cpf varchar(11) references public.clientes(cpf) on delete set null,
    tipo_evento varchar(100) not null,
    dados_evento jsonb,
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_interacoes_busca on public.log_interacoes(estabelecimento_id, cliente_cpf);

-- ==========================================
-- TRIGGERS E FUNÇÕES DE AUTOMAÇÃO DE ESTOQUE
-- ==========================================

-- Função para deduzir estoque na criação de um item_pedido (se gerenciar_estoque for ativo)
create or replace function public.processar_decremento_estoque()
returns trigger as $$
declare
    v_gerenciar_estoque boolean;
    v_quantidade_estoque integer;
    v_estabelecimento_id uuid;
begin
    -- Buscar status de estoque do produto
    select gerenciar_estoque, quantidade_estoque, estabelecimento_id 
    into v_gerenciar_estoque, v_quantidade_estoque, v_estabelecimento_id
    from public.produtos 
    where id = NEW.produto_id;

    if v_gerenciar_estoque = true then
        -- Decrementar estoque na tabela produtos
        update public.produtos 
        set quantidade_estoque = quantidade_estoque - NEW.quantidade,
            atualizado_em = now()
        where id = NEW.produto_id;

        -- Registrar a transação de estoque
        insert into public.transacoes_estoque (
            estabelecimento_id,
            produto_id,
            quantidade_alterada,
            tipo,
            justificativa,
            criado_em
        ) values (
            v_estabelecimento_id,
            NEW.produto_id,
            -NEW.quantidade,
            'venda',
            'Dedução automática referente ao pedido ' || NEW.pedido_id,
            now()
        );
    end if;
    
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger disparado após a inserção de um item no pedido
create trigger trg_itens_pedido_decremento_estoque
after insert on public.itens_pedido
for each row
execute function public.processar_decremento_estoque();

-- ==========================================
-- HABILITAR ROW LEVEL SECURITY (RLS) PARA SEGURANÇA
-- ==========================================

alter table public.estabelecimentos enable row level security;
alter table public.categorias_cardapio enable row level security;
alter table public.produtos enable row level security;
alter table public.pedidos enable row level security;
alter table public.itens_pedido enable row level security;
alter table public.sessoes_mesa enable row level security;
alter table public.sessoes_chat enable row level security;
alter table public.mensagens_chat enable row level security;
alter table public.transacoes_estoque enable row level security;

-- Exemplo de política de segurança (Admin só lê dados de seus estabelecimentos)
create policy "Dono gerencia seus estabelecimentos"
    on public.estabelecimentos
    for all
    using (auth.uid() = dono_id);

create policy "Dono gerencia categorias de seus estabelecimentos"
    on public.categorias_cardapio
    for all
    using (
        estabelecimento_id in (
            select id from public.estabelecimentos where dono_id = auth.uid()
        )
    );

create policy "Dono gerencia produtos de seus estabelecimentos"
    on public.produtos
    for all
    using (
        estabelecimento_id in (
            select id from public.estabelecimentos where dono_id = auth.uid()
        )
    );
