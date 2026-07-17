# HYPOTHESES.md — Hipóteses do Projeto

> Status: ✅ Validada | 🔄 Em validação | 🔮 Futura

---

## Hipóteses Validadas ✅

### H001 — A falta de mão de obra noturna é uma dor real e generalizada

**Hipótese**: Bares e restaurantes têm dificuldade crescente de contratar garçons para turnos noturnos e fins de semana.

**Status**: ✅ Validada (amplamente documentado no setor; dado empírico do mercado brasileiro)

---

### H002 — O modelo de intermediação de pagamento gera desconfiança

**Hipótese**: Donos de estabelecimento têm resistência a sistemas que retêm o dinheiro dos clientes antes de repassar.

**Status**: ✅ Validada (queixas recorrentes identificadas em avaliações públicas de Anota AI e Saipos)

---

### H003 — CPF como chave de identidade resolve o problema de mesa e telefone

**Hipótese**: Usar CPF como identificador único do cliente elimina os problemas de troca de mesa e telefone reciclado que afetam o modelo atual dos concorrentes.

**Status**: ✅ Validada (decisão de arquitetura tomada nas sessões 1-3 do Manus e mantida)

---

### H004 — Mensalidade fixa é modelo preferido pelo estabelecimento

**Hipótese**: Donos de bar preferem pagar uma mensalidade fixa a ceder percentual por transação ou aceitar atraso no repasse.

**Status**: ✅ Validada (lógica de negócio confirmada; previsibilidade de custo é valor para PME)

---

## Hipóteses em Validação 🔄

### H005 — O cliente aceita se identificar por CPF para pedir

**Hipótese**: O cliente final aceita informar CPF (ou ser identificado por ele) em troca de uma experiência melhor e divisão de conta justa.

**Status**: 🔄 Em validação

**O que precisamos descobrir**:
- Qual é o nível de resistência ao CPF como identificador?
- O consentimento LGPD precisa ser mais ou menos explícito para gerar confiança?
- O cliente prefere CPF ou login social (Google/Apple)?

---

### H006 — QR Code é suficiente como canal de entrada (sem precisar de app)

**Hipótese**: O cliente não precisa instalar nenhum aplicativo. QR Code abrindo o chatbot no navegador é suficiente para o MVP.

**Status**: 🔄 Em validação

**O que precisamos descobrir**:
- A experiência web é boa o suficiente no mobile?
- Quantos clientes têm resistência ao WhatsApp como canal alternativo?

---

### H007 — O estabelecimento consegue configurar o cardápio sem suporte técnico

**Hipótese**: O painel administrativo do Vurio é simples o suficiente para que o dono configure o cardápio sem precisar de help desk.

**Status**: 🔄 Em validação

**O que precisamos descobrir**:
- Qual é o nível de letramento digital do público-alvo?
- Onboarding guiado resolve ou precisa de atendimento humano inicial?

---

### H008 — Divisão de item compartilhado com confirmação individual gera valor percebido

**Hipótese**: A feature de dividir um item (ex: tábua de frios) com confirmação de cada pessoa da mesa é suficientemente valiosa para ser diferencial de adoção.

**Status**: 🔄 Em validação

---

## Hipóteses Futuras 🔮

### H009 — Dados agregados têm valor de consultoria para o estabelecimento

**Hipótese**: Padrões de consumo por perfil de cliente, horário e dia da semana têm valor comercial como inteligência de negócio para o estabelecimento.

**Status**: 🔮 Futura (Roadmap V2)

---

### H010 — Fidelização com IA proativa aumenta ticket médio

**Hipótese**: Um sistema que lembra o histórico do cliente e faz sugestões baseadas em comportamento anterior aumenta o ticket médio em pelo menos 15%.

**Status**: 🔮 Futura (Roadmap V2)

---

### H011 — O modelo escala para outros países da América Latina

**Hipótese**: A mesma dor de falta de mão de obra e modelo de conta por mesa existe em outros países da AL, tornando o Vurio expansível para além do Brasil.

**Status**: 🔮 Futura (horizonte de 3+ anos)

---

*Última atualização: 2026-07-17*
