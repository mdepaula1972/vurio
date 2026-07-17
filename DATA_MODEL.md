# DATA_MODEL.md — Modelo de Dados

> Decisão arquitetural central do Vurio.
> Definido nas sessões 1-3 do Manus. Registrado aqui para continuidade permanente.

---

## Princípio Central

> **O cliente é uma pessoa, não uma mesa.**

Toda a modelagem parte dessa premissa.

---

## Entidades Principais

### Cliente
```
cliente
  - cpf (PK, chave única permanente)
  - nome
  - email (opcional)
  - criado_em
  - consentimento_basico (boolean) -- uso dentro do estabelecimento
  - consentimento_agregado (boolean) -- uso cross-estabelecimento (opt-in)
```

**Regra**: CPF é imutável e é a única chave de identidade permanente do cliente.

---

### Histórico de Telefone
```
historico_telefone
  - id (PK)
  - cliente_cpf (FK → cliente.cpf)
  - telefone
  - associado_em
  - desassociado_em (nullable)
  - ativo (boolean)
```

**Regra**: Telefone é um canal, não uma identidade. Um CPF pode ter múltiplos telefones ao longo do tempo. Um telefone pode ter sido de múltiplos CPFs (reciclagem de número).

**Lógica de confirmação**: Se o telefone informado não tem associação ativa recente com nenhum CPF, o sistema pede confirmação de identidade antes de reconhecer o cliente.

---

### Estabelecimento
```
estabelecimento
  - id (PK, UUID)
  - nome
  - cnpj
  - plano (enum: basic, pro, enterprise)
  - ativo (boolean)
  - criado_em
  - configuracoes (jsonb) -- cardápio, horários, etc.
```

---

### Sessão de Mesa
```
sessao_mesa
  - id (PK, UUID)
  - estabelecimento_id (FK)
  - identificador_mesa (text) -- "Mesa 5", "Balcão", "Área externa"
  - aberta_em
  - fechada_em (nullable)
  - status (enum: aberta, fechando, encerrada)
```

**Regra**: Sessão de mesa é um agrupador físico e temporal — não é unidade de cobrança. Clientes entram e saem de sessões. Um cliente pode estar em múltiplas sessões (improvável, mas possível).

```
sessao_mesa_cliente
  - sessao_id (FK)
  - cliente_cpf (FK)
  - entrou_em
  - saiu_em (nullable)
```

---

### Pedido
```
pedido
  - id (PK, UUID)
  - cliente_cpf (FK)
  - estabelecimento_id (FK)
  - sessao_id (FK, nullable) -- cliente pode pedir sem estar em sessão de mesa
  - status (enum: pendente, confirmado, em_preparo, pronto, entregue, cancelado)
  - criado_em
  - atualizado_em
  - total (decimal)
  - observacoes (text)
```

```
item_pedido
  - id (PK)
  - pedido_id (FK)
  - produto_id (FK)
  - quantidade (int)
  - preco_unitario (decimal)
  - observacao (text)
  - status_divisao (enum: individual, compartilhado_pendente, compartilhado_confirmado)
```

---

### Divisão de Item Compartilhado
```
divisao_item
  - id (PK)
  - item_pedido_id (FK)
  - cliente_cpf (FK) -- quem está participando da divisão
  - confirmado (boolean)
  - confirmado_em (nullable)
  - valor_proporcional (decimal)
```

**Regra**: Um item compartilhado (ex: tábua de frios) pode ser dividido entre múltiplos clientes da mesma sessão. Cada um confirma individualmente sua parte antes do item ser contabilizado no pedido de cada um.

---

### Produto (Cardápio)
```
produto
  - id (PK, UUID)
  - estabelecimento_id (FK)
  - nome
  - descricao
  - preco (decimal)
  - categoria (text)
  - disponivel (boolean)
  - imagem_url (text, nullable)
  - criado_em
  - atualizado_em
```

---

### Interação (Log de IA)
```
interacao
  - id (PK, UUID)
  - cliente_cpf (FK, nullable) -- pode ser antes de identificar
  - estabelecimento_id (FK)
  - sessao_id (FK, nullable)
  - canal (enum: qrcode_web, whatsapp)
  - tipo (enum: mensagem_entrada, mensagem_saida, acao_sistema)
  - conteudo (text) -- mensagem bruta
  - metadata (jsonb) -- intent detectado, confiança, etc.
  - criado_em
```

**Propósito**: Log bruto de todas as interações com o chatbot. Base para treinamento futuro, análise de intenção e auditoria.

---

### Usuário Administrativo
```
usuario_admin
  - id (PK, UUID)
  - estabelecimento_id (FK)
  - nome
  - email
  - nivel_acesso (enum: dono, cozinha_bar, corredor_entregador)
  - ativo (boolean)
  - criado_em
```

---

## Regras de Segregação Multi-Tenant

- Todas as tabelas operacionais têm `estabelecimento_id`
- Row Level Security (RLS) do Supabase ativo em todas as tabelas
- Política: usuário autenticado só acessa linhas do seu `estabelecimento_id`
- Exceção: tabela `cliente` e `historico_telefone` são compartilhadas (com consentimento agregado opt-in)

---

## Diagrama Simplificado

```
cliente (cpf)
  └─ historico_telefone (telefone)
  └─ sessao_mesa_cliente ──→ sessao_mesa (estabelecimento_id)
  └─ pedido (estabelecimento_id)
       └─ item_pedido
            └─ divisao_item (cliente_cpf)
  └─ interacao (estabelecimento_id)

estabelecimento
  └─ produto (cardápio)
  └─ usuario_admin
  └─ sessao_mesa
```

---

*Última atualização: 2026-07-17*
*Definido nas sessões 1-3 do Manus, migrado e formalizado aqui.*
