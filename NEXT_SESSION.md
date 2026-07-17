# NEXT_SESSION.md — Contexto para a Próxima Sessão

> Este arquivo é atualizado ao final de cada sessão.
> Leia este arquivo primeiro ao retomar o projeto.

---

## Status Atual: Sessão Fundadora concluída — código do Manus ainda não migrado

**Data da última sessão**: 2026-07-17

---

## Onde Paramos

### O que existe hoje
- Repositório `vurio` publicado no GitHub (mdepaula1972)
- Toda a documentação do Projeto Zero criada e commitada
- Domínios vurio.com.br e vurio.online adquiridos
- Stack definida: GitHub → Vercel → Supabase

### O que veio do Manus (sessões 1-3)
- Modelo de dados: ✅ documentado no `DATA_MODEL.md`
- Fluxo de conversa inicial: ✅ existente no código baixado (localização a confirmar)
- Sessões 6-7 (divisão de conta, níveis de acesso): ❌ não iniciadas

### Pendente crítico
- **O código baixado do Manus ainda não foi migrado para este repositório**
- Localização provável: pasta baixada pelo usuário (confirmar localização)

---

## O Que Foi Decidido

1. Nome definitivo: **Vurio**
2. Domínios: vurio.com.br e vurio.online
3. Stack: GitHub → Vercel → Supabase
4. CPF como chave única de identidade do cliente
5. Vurio nunca retém dinheiro do estabelecimento
6. Dois níveis de consentimento LGPD (básico obrigatório + agregado opt-in)
7. Banco multi-tenant com RLS por estabelecimento_id
8. WhatsApp API não-oficial apenas em testes; Meta Cloud API em produção
9. Três níveis de acesso: Dono/Admin, Cozinha/Bar, Corredor/Entregador

---

## O Que Falta Fazer

### Imediato — Próxima sessão
- [ ] **Localizar o código baixado do Manus** e verificar o que existe
- [ ] **Migrar o código para `D:\vurio`** e commitar no repositório
- [ ] **Criar projeto no Supabase** (vurio-dev)
- [ ] **Aplicar as migrações SQL** baseadas no DATA_MODEL.md
- [ ] **Verificar o fluxo de conversa** do chatbot existente

### Sequência após migração
- [ ] Implementar sessões 6-7: divisão de conta e níveis de acesso
- [ ] Painel admin: Dono (cardápio, pedidos, configurações)
- [ ] Painel admin: Cozinha/Bar e Corredor/Entregador
- [ ] Teste completo de fluxo: QR Code → pedido → divisão → fechamento
- [ ] Deploy no Vercel

---

## Próxima Tarefa

**Localizar e auditar o código das sessões 1-3 do Manus.**

Perguntas a responder:
- Onde está o código baixado do Manus? (pasta local a confirmar)
- O que foi realmente construído? (chatbot, painel, migrações?)
- Está em qual linguagem/framework?
- O que precisa ser reescrito vs. aproveitado?

---

## Como Retomar (para a IA que assumir)

1. Leia este arquivo primeiro
2. Leia `DATA_MODEL.md` para entender a arquitetura de dados
3. Leia `DECISIONS.md` para entender as decisões irrevogáveis
4. Leia `MVP.md` para entender o escopo do que estamos construindo
5. Leia `ROADMAP.md` para entender em qual etapa estamos
6. **Nunca intermediar pagamento** — veja D003 em DECISIONS.md
7. **Sempre usar CPF como chave primária do cliente** — veja D001

---

*Última atualização: 2026-07-17 — Sessão Fundadora*
