# ROADMAP.md — Mapa do Projeto

> O roadmap é um guia de intenção, não um cronograma rígido.

---

## Visão Geral

```
Projeto Zero → MVP → Primeiros Estabelecimentos → Escala → Fidelização/CRM → Inteligência → Marketplace
```

---

## Etapa 0 — Projeto Zero

**Status**: 🟡 Em andamento

**Objetivo**: Migrar o conhecimento das sessões 1-3 do Manus para o repositório e estruturar a memória permanente do projeto.

**Entregáveis**:
- [x] Repositório `vurio` criado no GitHub (mdepaula1972)
- [x] Domínios vurio.com.br e vurio.online adquiridos
- [x] README.md, VISION.md, PROBLEM.md
- [x] HYPOTHESES.md, DECISIONS.md, ROADMAP.md
- [x] DATA_MODEL.md com modelo de dados completo
- [x] CHANGELOG.md, NEXT_SESSION.md
- [x] MARKETING.md, MVP.md, IDEAS.md, ORACLE.md
- [ ] Migrar código das sessões 1-3 do Manus para o repositório
- [ ] Verificar o que foi efetivamente construído nas sessões 1-3
- [ ] Criar migrações SQL no Supabase

**Critério de conclusão**: Qualquer IA pode ler este repositório e retomar o desenvolvimento com pleno contexto.

---

## Etapa 1 — MVP

**Status**: 🟡 Parcialmente iniciado (sessões 1-3 no Manus)

**Objetivo**: Pedido funcional via chatbot — do QR Code ao prato na mesa.

**Entregáveis**:
- [x] Modelo de dados definido
- [x] Fluxo de conversa inicial (sessões 1-3 Manus)
- [ ] Migrações SQL aplicadas no Supabase
- [ ] Chatbot funcional: identificação por CPF/telefone
- [ ] Chatbot funcional: listagem de cardápio e pedido
- [ ] Painel admin: Dono/Admin (cardápio, pedidos)
- [ ] Painel admin: Cozinha/Bar (fila de preparo)
- [ ] Painel admin: Corredor/Entregador (fila de entrega)
- [ ] QR Code por mesa gerando sessão
- [ ] Integração WhatsApp (API não-oficial para testes)

**Critério de conclusão**: O fundador consegue fazer um pedido completo em um estabelecimento de teste usando CPF como identificador.

---

## Etapa 2 — Divisão de Conta (Sessões 6-7 pendentes)

**Status**: ⬜ Não iniciado

**Objetivo**: Implementar divisão de conta por pessoa e divisão de item compartilhado.

**Entregáveis**:
- [ ] Divisão de conta: cada cliente paga o que pediu
- [ ] Divisão de item compartilhado com confirmação individual
- [ ] Resumo de conta por pessoa na sessão de mesa
- [ ] Troca de mesa sem perda de pedido

**Critério de conclusão**: Grupo de 4 pessoas consegue dividir conta — incluindo 1 item compartilhado — sem intervenção de garçom.

---

## Etapa 3 — Primeiros Estabelecimentos

**Status**: ⬜ Não iniciado

**Objetivo**: Colocar o produto em 3-5 estabelecimentos reais e coletar feedback intensivo.

**Entregáveis**:
- [ ] Onboarding guiado para o dono configurar cardápio
- [ ] WhatsApp API oficial (Meta Cloud API)
- [ ] Suporte ativo durante primeiras semanas
- [ ] Métricas básicas: pedidos/dia, tempo médio de atendimento
- [ ] Primeiros contratos de mensalidade

**Critério de conclusão**: 3 estabelecimentos pagando mensalidade após 30 dias de uso.

---

## Etapa 4 — Escala

**Status**: ⬜ Não iniciado

**Objetivo**: Crescer para 50+ estabelecimentos com processos automatizados de onboarding e suporte.

**Entregáveis**:
- [ ] Onboarding self-service completo
- [ ] Documentação e tutoriais em vídeo
- [ ] Painel de saúde do sistema por estabelecimento
- [ ] Tiers de planos (básico, pro, enterprise)
- [ ] Sistema de cobrança de mensalidade automatizado

---

## Etapa 5 — Fidelização e CRM com IA (Roadmap V2)

**Status**: ⬜ Não iniciado

**Objetivo**: Transformar o histórico de interações em inteligência de fidelização.

**Entregáveis**:
- [ ] IA proativa: "Sua cerveja favorita está em promoção hoje"
- [ ] Alertas de limite de consumo (solicitado pelo cliente)
- [ ] Dashboard de relatórios para o estabelecimento
- [ ] Programa de fidelização configurável

---

## Etapa 6 — Inteligência de Negócio

**Status**: ⬜ Não iniciado

**Objetivo**: Usar dados agregados para gerar inteligência de mercado.

**Entregáveis**:
- [ ] Dashboard: padrões de consumo por dia/horário/perfil
- [ ] Integração com maquininha (leitura de pagamento)
- [ ] Consultoria com dados agregados e anonimizados
- [ ] Benchmarking entre estabelecimentos similares

---

## Etapa 7 — Marketplace e Expansão

**Status**: ⬜ Não iniciado

**Objetivo**: Abrir integrações com terceiros e expandir geograficamente.

**Entregáveis**:
- [ ] API pública para integrações (PDV, delivery, contabilidade)
- [ ] Expansão para outros países da América Latina
- [ ] Marketplace de integrações

---

*Última atualização: 2026-07-17*
