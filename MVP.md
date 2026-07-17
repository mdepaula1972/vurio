# MVP.md — Produto Mínimo Viável

> O MVP resolve exatamente **um** problema:
> **O pedido chega à cozinha de forma correta — seja pelo cliente direto no app ou pelo garçom lançando em nome do cliente.**

---

## Escopo do MVP

### Inclui

**Para o cliente**:
- Acesso via QR Code (abre no navegador, sem instalar app)
- Identificação por CPF + telefone
- Listagem do cardápio
- Realização de pedido
- Acompanhamento do status do pedido

**Para o estabelecimento (Modo Autônomo)**:
- Painel Dono/Admin: configuração de cardápio, visualização de pedidos
- Painel Cozinha/Bar: fila de preparo com atualização de status (+ alerta sonoro)
- Painel Corredor/Entregador: fila de entrega com nome do cliente
- Notificação via WhatsApp para dono/gerente a cada novo pedido

**Para o estabelecimento (Modo Assistido — D011)**:
- Garçom acessa painel do Corredor/Entregador
- Busca cliente por nome ou CPF parcial para lançar pedido em seu nome
- **CPF exibido sempre mascarado**: `***.***-XXX-**` — apenas dígitos centrais visíveis (D012)
- Garçom confirma verbalmente com o cliente antes de lançar

**Infraestrutura**:
- Multi-tenant com isolamento por `estabelecimento_id`
- Autenticação de admin via Supabase Auth
- Deploy no Vercel + banco no Supabase

---

### Não inclui no MVP

| Feature | Motivo |
|---|---|
| Divisão de conta | Sessões 6-7 pendentes — virá logo após MVP |
| Divisão de item compartilhado | Idem |
| WhatsApp API oficial | Custo e burocracia — testes com API não-oficial |
| Fidelização com IA | Roadmap V2 |
| Dashboard de relatórios | Pós-escala |
| Pagamento integrado | Fora do escopo por princípio (D003) |
| App mobile nativo | Web-first |

---

## Status Atual

| Componente | Status | Origem |
|---|---|---|
| Modelo de dados | ✅ Definido | Sessões 1-3 Manus → DATA_MODEL.md |
| Migrações SQL | ⚠️ A confirmar | Código baixado do Manus (não migrado) |
| Fluxo de conversa do chatbot | ⚠️ A confirmar | Código baixado do Manus |
| Painel admin | ⚠️ A confirmar | Código baixado do Manus |
| Integração Supabase | ⚠️ A confirmar | Código baixado do Manus |
| Divisão de conta | ❌ Não iniciado | Sessões 6-7 pendentes |
| Níveis de acesso | ❌ Não iniciado | Sessões 6-7 pendentes |
| Deploy Vercel | ❌ Não iniciado | — |

> ⚠️ = código existe no Manus mas ainda não migrado/verificado

---

## Fluxo do MVP (User Journey do Cliente)

```
1. Cliente escaneia QR Code na mesa
2. Navegador abre o chatbot do Vurio
3. Chatbot pergunta CPF
4. CPF encontrado → confirma telefone → bem-vindo de volta
   CPF novo → coleta telefone → aceita consentimento LGPD → cadastro
5. Chatbot apresenta cardápio
6. Cliente escolhe itens
7. Pedido confirmado → status: "Pedido recebido"
8. Cozinha/bar vê o pedido no painel e atualiza status
9. Entregador vê o pedido pronto e entrega
10. Cliente acompanha status em tempo real
```

---

## Fluxo do MVP (User Journey do Admin)

```
1. Dono acessa vurio.com.br/admin
2. Login com email/senha (Supabase Auth)
3. Configura cardápio (nome, descrição, preço, categoria, disponibilidade)
4. Gera QR Codes por mesa
5. Monitora pedidos em tempo real
6. Visualiza histórico do dia
```

---

## Critério de Sucesso do MVP

> O MVP é um sucesso quando o fundador consegue fazer um pedido completo — do QR Code ao status "entregue" — em um estabelecimento de teste, usando CPF como identificador, sem precisar chamar nenhum garçom.

---

## Stack do MVP

| Camada | Tecnologia |
|---|---|
| Frontend (chatbot) | Next.js (App Router) |
| Frontend (admin) | Next.js (App Router) |
| Backend/API | Next.js API Routes |
| Banco de dados | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| IA/Chatbot | OpenAI API (GPT-4o) |
| WhatsApp (teste) | API não-oficial |
| Deploy | Vercel |
| Fonte da verdade | GitHub (mdepaula1972/vurio) |

---

*Última atualização: 2026-07-17*
