# DECISIONS.md — Log de Decisões

> Toda decisão importante do projeto é registrada aqui.
> Nenhuma decisão desaparece. O histórico é permanente.

---

## D001 — CPF como chave única do cliente

- **Data**: 2026-07-17 (decidido nas sessões 1-3 do Manus)
- **Motivo**: Telefone muda. Mesa é transitória. CPF é permanente e garante que o histórico do cliente persiste entre visitas, entre estabelecimentos (com consentimento) e independe de troca de número.
- **Impacto**: Modelo de dados inteiro construído em torno do CPF como chave primária do cliente. Telefone é um canal separado com histórico próprio.
- **Alternativas consideradas**:
  - Login por telefone (descartado: telefone é reciclado, cria identidades falsas)
  - Login social (descartado: barreira alta em contexto de bar; pode ser adicionado depois)
  - Mesa como identificador (descartado: cliente troca de mesa, mesa é contexto físico, não identidade)

---

## D002 — Histórico de Telefone separado da entidade Cliente

- **Data**: 2026-07-17 (decidido nas sessões 1-3 do Manus)
- **Motivo**: Número de telefone pode ser reciclado pela operadora. Se o cliente A usava o número X e agora o número X pertence ao cliente B, o sistema não pode confundir os dois. O histórico de telefone é rastreado separadamente com timestamps de associação.
- **Impacto**: Tabela `historico_telefone` separada da tabela `cliente`. Confirmação de identidade obrigatória quando número não tem histórico recente com aquele CPF.
- **Alternativas consideradas**: Apenas campo `telefone` no cliente (descartado: não resolve reciclagem)

---

## D003 — Vurio nunca retém dinheiro do estabelecimento

- **Data**: 2026-07-17
- **Motivo**: A principal queixa contra Anota AI e Saipos é o repasse atrasado. O Vurio elimina esse problema por design — não intermediando pagamento. Modelo de receita é mensalidade fixa.
- **Impacto**: O Vurio não processa pagamento do cliente final. O estabelecimento cobra diretamente. O Vurio só cobra do estabelecimento (mensalidade).
- **Alternativas consideradas**: Percentual por transação (descartado: cria o mesmo problema dos concorrentes); freemium + transação (descartado: mesma lógica)

---

## D004 — Dois níveis de consentimento LGPD

- **Data**: 2026-07-17 (decidido nas sessões 1-3 do Manus)
- **Motivo**: A LGPD exige consentimento explícito. O Vurio tem dois tipos de dado: (1) dado necessário para o funcionamento dentro do estabelecimento e (2) dado que pode ser compartilhado entre estabelecimentos para melhorar a experiência. O segundo é opcional e opt-in.
- **Impacto**:
  - Consentimento básico (obrigatório): uso dos dados dentro do estabelecimento para realizar o pedido
  - Consentimento agregado/cross-estabelecimento (opcional): histórico compartilhado entre parceiros Vurio
- **Alternativas consideradas**: Consentimento único (descartado: juridicamente frágil e não respeita a granularidade da LGPD)

---

## D005 — Sessão de Mesa como agrupador físico, não unidade de cobrança

- **Data**: 2026-07-17 (decidido nas sessões 1-3 do Manus)
- **Motivo**: Clientes se sentam juntos fisicamente, mas cada um é responsável pelo seu pedido. A "mesa" é apenas um contexto de agrupamento para facilitar a divisão de itens compartilhados — nunca é a unidade de cobrança.
- **Impacto**: Tabela `sessao_mesa` com FK para clientes participantes. Pedido sempre vinculado a `cliente_id + estabelecimento_id`, nunca apenas à mesa.
- **Alternativas consideradas**: Mesa como unidade de cobrança (descartado: não resolve divisão, cria confusão na troca de mesa)

---

## D006 — Stack: GitHub → Vercel → Supabase

- **Data**: 2026-07-17
- **Motivo**: Stack comprovada para SaaS B2B de médio porte. Supabase oferece PostgreSQL gerenciado com Row Level Security (essencial para multi-tenant), auth nativo e real-time. Vercel para deploy contínuo com preview por branch. GitHub como fonte da verdade.
- **Impacto**: Toda a infraestrutura é serverless e escalável sem DevOps dedicado no início.
- **Alternativas consideradas**: Railway (descartado: menos ecossistema); AWS (descartado: complexidade desnecessária no MVP); Firebase (descartado: não-relacional, inadequado para o modelo de dados)

---

## D007 — API do WhatsApp: não-oficial apenas em testes, oficial em produção

- **Data**: 2026-07-17
- **Motivo**: API não-oficial (Baileys, WPPConnect) é risco de banimento pela Meta. Em produção, apenas a API oficial da Meta (Cloud API) será usada — com custo por mensagem, mas com confiabilidade garantida.
- **Impacto**: Testes podem usar API não-oficial. Qualquer estabelecimento real usa apenas a API oficial.
- **Alternativas consideradas**: Apenas QR Code sem WhatsApp (mantido como opção paralela)

---

## D008 — Banco único multi-tenant com segregação por estabelecimento_id

- **Data**: 2026-07-17 (decidido nas sessões 1-3 do Manus)
- **Motivo**: Banco separado por estabelecimento seria inviável operacionalmente no MVP. Banco único com `estabelecimento_id` em todas as tabelas + Row Level Security do Supabase garante isolamento sem complexidade de infraestrutura.
- **Impacto**: Todas as queries devem incluir `estabelecimento_id`. RLS ativo no Supabase.
- **Alternativas consideradas**: Schema separado por estabelecimento (descartado: complexidade de migração); banco separado por estabelecimento (descartado: custo e ops)

---

## D009 — Nome do produto: Vurio

- **Data**: 2026-07-17
- **Motivo**: Nome curto, memorável, sem conotação literal que limite o escopo futuro. Domínios vurio.com.br e vurio.online adquiridos.
- **Impacto**: Branding, domínios, repositório e todos os documentos usam "Vurio".
- **Alternativas consideradas**: Zé da Mesa (descartado: não escala), Seu Garçom (descartado: idem), Tably (descartado), Splitie (descartado)

---

## D010 — Três níveis de acesso administrativo

- **Data**: 2026-07-17 (decidido nas sessões 1-3 do Manus)
- **Motivo**: Diferentes funções do estabelecimento precisam de visibilidades diferentes.
- **Impacto**:
  - **Dono/Admin**: acesso total (cardápio, relatórios, configurações, financeiro)
  - **Cozinha/Bar**: apenas pedidos da sua área (sem acesso a financeiro ou configurações)
  - **Corredor/Entregador**: apenas fila de entrega (qual pedido levar para qual mesa/cliente)
- **Alternativas consideradas**: Dois níveis (descartado: insuficiente para operação real)

---

*Última atualização: 2026-07-17*
