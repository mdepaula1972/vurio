-- SEED_TEST_DATA.sql — Script de Dados Iniciais para Teste (Vurio)
-- IMPORTANTE: Antes de rodar este script, crie um usuário no Supabase Auth pelo painel (/admin)
-- e substitua 'SEU_USER_ID_AQUI' abaixo pelo UUID do seu usuário no Supabase Auth.

-- 1. Inserir Estabelecimento de Teste
-- Substitua 'SEU_USER_ID_AQUI' pelo ID encontrado no Supabase Auth -> Users
INSERT INTO public.estabelecimentos (id, nome, slug, dono_id)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- UUID do Estabelecimento
    'Bar do Exemplo', 
    'exemplo', 
    'ed0d9a4e-48db-4ad0-b83f-c81e958757cf' -- <--- COLOQUE SEU UUID DO SUPABASE AUTH AQUI
) ON CONFLICT (slug) DO NOTHING;

-- 2. Inserir Categorias de Teste
INSERT INTO public.categorias_cardapio (id, estabelecimento_id, nome, ordem)
VALUES 
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bebidas', 1),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Comidas', 2)
ON CONFLICT (id) DO NOTHING;

-- 3. Inserir Itens do Cardápio com Módulo de Estoque (D025)
INSERT INTO public.produtos (id, estabelecimento_id, categoria_id, nome, descricao, preco, disponivel, restricao_idade, gerenciar_estoque, quantidade_estoque, limite_alerta_estoque, ordem)
VALUES 
    -- Bebida com controle de estoque e maioridade (D021)
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 
     'Chopp Heineken 500ml', 'Chopp gelado na caneca congelada', 15.00, true, true, true, 10, 3, 1),
     
    -- Bebida sem restrição de idade com controle de estoque
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 
     'Coca-Cola Lata', 'Refrigerante 350ml', 6.50, true, false, true, 5, 2, 2),
     
    -- Comida sem controle de estoque (estoque infinito de produção)
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 
     'Batata Frita com Queijo', 'Porção generosa com cheddar e bacon', 28.90, true, false, false, 0, 0, 1)
ON CONFLICT (id) DO NOTHING;
