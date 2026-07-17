# RISKS.md — Registro de Riscos e Pontos de Atenção

> Riscos identificados durante o desenvolvimento.
> Cada risco tem status, decisão tomada e responsável.
> Nenhum risco some deste arquivo — apenas muda de status.

---

## Formato

```
### R[ID] — [Título]
- **Categoria**: Legal / Segurança / UX / Operacional / Técnico
- **Impacto**: Alto / Médio / Baixo
- **Status**: 🔴 Aberto | 🟡 Em andamento | 🟢 Mitigado | ⏸️ Aceito (risco consciente)
- **Decisão**: O que foi decidido
- **Referência**: Link para DECISIONS.md se houver
```

---

## Riscos Legais

### R001 — Coleta de CPF sem Política de Privacidade publicada
- **Categoria**: Legal (LGPD)
- **Impacto**: Alto
- **Status**: ⏸️ Aceito para fase de testes internos
- **Decisão**: Testes serão realizados apenas pelo fundador e pessoas próximas. Política de Privacidade e Termos de Uso são **obrigação pré-lançamento** — nenhum estabelecimento externo usará o sistema sem esses documentos publicados.
- **Referência**: D013

---

### R002 — Menor de 18 anos pedindo bebida alcoólica
- **Categoria**: Legal / UX
- **Impacto**: Alto
- **Status**: 🟡 Em andamento (pesquisa de solução)
- **Decisão**:
  1. Pesquisar serviços brasileiros que validam CPF e retornam faixa etária (Serpro Datavalid, Serasa Experian — exigem acordo comercial)
  2. Se não houver solução técnica viável no MVP: na primeira vez que cliente pede item com restrição etária, exibir confirmação explícita de maioridade, registrar no banco com timestamp e aceite dos termos de risco (declaração falsa é responsabilidade do cliente)
  3. Garçom é sempre notificado quando item restrito é pedido — ele faz a verificação visual final
- **Referência**: D021
- **Ação pendente**: Verificar viabilidade e custo de Serpro Datavalid antes do lançamento

---

### R003 — Dados retidos além do necessário
- **Categoria**: Legal (LGPD)
- **Impacto**: Médio
- **Status**: 🟢 Mitigado
- **Decisão**: Política de retenção definida em D020. Histórico fiscal: 5 anos. Mensagens de chat: 180 dias. Job automático de limpeza a ser implementado.
- **Referência**: D020

---

## Riscos de Segurança

### R004 — Painel de cozinha/bar/corredor sem autenticação
- **Categoria**: Segurança
- **Impacto**: Médio (durante testes) / Alto (em produção)
- **Status**: ⏸️ Aceito para fase de testes internos
- **Decisão**: PIN obrigatório por função (cozinha, bar, corredor) é **requisito pré-lançamento**. Testes internos podem operar sem.
- **Referência**: D015

---

### R005 — QR Code compartilhado externamente gera pedidos fraudulentos
- **Categoria**: Segurança / UX
- **Impacto**: Médio
- **Status**: 🟢 Mitigado (por design)
- **Decisão**: Sistema terá abertura e fechamento de turno pelo Dono/Admin. Fora do horário de funcionamento configurado, QR Code retorna mensagem de encerramento e não aceita pedidos. Implementar como feature do MVP.
- **Referência**: D017

---

### R006 — Funcionário demitido com acesso ativo
- **Categoria**: Segurança / Legal
- **Impacto**: Alto
- **Status**: 🟢 Mitigado (por design)
- **Decisão**: Desativação de acesso = BLOQUEIO, nunca exclusão. Histórico preservado para caso de recontratação. Admin consegue bloquear em segundos. CPF já é mascarado (D012), então funcionário demitido não leva dados de clientes.
- **Referência**: D016, D012

---

### R007 — Flood/spam de pedidos por CPF ou sessão
- **Categoria**: Segurança / Operacional
- **Impacto**: Médio
- **Status**: 🟡 Em andamento
- **Decisão**: Implementar rate limiting por CPF (máx. X pedidos por hora) e por sessão. Valores exatos a calibrar com o piloto.
- **Referência**: D019

---

## Riscos Técnicos

### R008 — Queda de internet no estabelecimento
- **Categoria**: Operacional / Técnico
- **Impacto**: Alto (sistema para completamente)
- **Status**: ⏸️ Aceito (risco do estabelecimento)
- **Decisão**: O estabelecimento é responsável por ter redundância de internet (chip de dados, segundo provedor) ou procedimento manual de contingência. O Vurio documenta esse risco no onboarding e recomenda redundância mínima. Cache local do cardápio será implementado (D023) para mitigar parcialmente.
- **Referência**: D023

---

### R009 — Pico de acessos simultâneos (abertura de bar, show, evento)
- **Categoria**: Técnico
- **Impacto**: Médio
- **Status**: 🟡 Em andamento
- **Decisão**: Realizar testes de carga e estresse antes do lançamento. Definir limites de concorrência e implementar fila de processamento de mensagens do chatbot. Supabase e Vercel escalam automaticamente, mas o LLM (OpenAI) tem limites de rate — implementar fila com timeout.
- **Referência**: D011 (contexto operacional)

---

### R010 — Preço do item muda durante o pedido em andamento
- **Categoria**: Legal (CDC) / Técnico
- **Impacto**: Baixo
- **Status**: 🟢 Mitigado (por decisão)
- **Decisão**: Pelo Código de Defesa do Consumidor, o preço válido é o do momento da **confirmação do pedido**, não da abertura do cardápio. O sistema registra o preço unitário no item do pedido no momento da confirmação — independente de mudanças futuras no cardápio.
- **Referência**: D018

---

### R011 — API WhatsApp não-oficial banida durante testes
- **Categoria**: Técnico / Operacional
- **Impacto**: Baixo (testes internos apenas)
- **Status**: ⏸️ Aceito conscientemente
- **Decisão**: API não-oficial usada exclusivamente em ambiente de testes internos. Antes do primeiro estabelecimento externo, migrar para API oficial via parceria existente. Processo de aprovação da Meta pode levar 2-4 semanas — iniciar quando primeiro piloto externo for confirmado.
- **Referência**: D022

---

### R012 — CPF com formato válido mas matematicamente inválido
- **Categoria**: Técnico / UX
- **Impacto**: Médio
- **Status**: 🟡 Em andamento
- **Decisão**: Implementar validação dos dígitos verificadores do CPF no frontend e no backend. Rejeitar CPFs com formato correto mas dígitos inválidos antes de qualquer operação.
- **Referência**: D014

---

## Riscos de UX / Produto

### R013 — Migração de stack (Manus → Supabase/Vercel/Next.js)
- **Categoria**: Técnico
- **Impacto**: Alto
- **Status**: 🟡 Em andamento
- **Decisão**: O código do Manus usa MySQL/TiDB, `invokeLLM` nativo e Manus OAuth — todos incompatíveis fora da plataforma. A migração para o stack definitivo (PostgreSQL/Supabase, OpenAI API direta, Supabase Auth) é necessária antes de qualquer piloto externo. Componentes de frontend (React + Tailwind) são aproveitáveis.
- **Referência**: MVP.md (Stack do MVP)

---

*Última atualização: 2026-07-17*
*Próxima revisão: após validação do fluxo completo do chatbot*
