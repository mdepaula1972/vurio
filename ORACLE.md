# ORACLE.md — Visão de IA e Inteligência de Dados

> O "Oráculo" do Vurio não é um produto separado.
> É a camada de inteligência que emerge naturalmente dos dados acumulados.

---

## O Que o Vurio Acumula

Cada interação no Vurio gera dados:

- **Quem pediu**: perfil do cliente (CPF, histórico)
- **O que pediu**: itens, categorias, valor
- **Quando**: dia, horário, sazonalidade
- **Onde**: estabelecimento, mesa, localização
- **Como**: canal (QR Code, WhatsApp), duração da sessão
- **Com quem**: grupo (sessão de mesa), divisão de conta

A tabela `interacao` é o log bruto. Com o tempo, ela se torna o ativo mais valioso do produto.

---

## Inteligência de Curto Prazo (MVP+)

### Para o Cliente
- Reconhecimento imediato: "Bem-vindo de volta, João!"
- Sugestão baseada no histórico: "Você costuma pedir X. Quer o de sempre?"
- Alerta de limite configurado pelo próprio cliente

### Para o Estabelecimento
- Fila de preparo otimizada por tempo médio de cada item
- Alertas de demora no preparo
- Itens mais pedidos por horário do dia

---

## Inteligência de Médio Prazo (Roadmap V2)

### IA Proativa para Fidelização
O sistema detecta padrões e age:
- "João não aparece há 3 semanas. Enviar cupom?"
- "Este grupo sempre pede tábua de frios. Sugerir na próxima vez que aparecerem juntos."

### Dashboard de Inteligência de Negócio
- Padrões de consumo por dia/hora/perfil
- Impacto do clima nos pedidos (dias frios → drinks quentes)
- Comparação de desempenho entre semanas/meses

---

## Inteligência de Longo Prazo (Etapa 6)

### Consultoria com Dados Agregados
Com dados de múltiplos estabelecimentos (anonimizados e com consentimento):
- Benchmarking de performance
- Padrões de mercado por região/tipo de estabelecimento
- Recomendações de cardápio baseadas em tendências

### Previsão de Demanda
- "Na próxima sexta com chuva, espere 30% menos movimento"
- "Este item tende a esgotar às 22h nas sextas"

---

## Princípios de Uso dos Dados

1. **Dados do cliente são do cliente** — consentimento explícito e granular
2. **Consentimento básico**: dados usados apenas dentro do estabelecimento
3. **Consentimento agregado**: dados usados entre estabelecimentos (opt-in)
4. **Anonimização obrigatória** para qualquer análise de mercado
5. **O cliente pode solicitar exclusão** dos seus dados a qualquer momento (LGPD Art. 18)

---

## A Vantagem Competitiva dos Dados

O Vurio tem uma vantagem que nenhum concorrente pode copiar rapidamente:

> **Identidade real por CPF + histórico acumulado ao longo do tempo.**

Enquanto outros sistemas sabem "a mesa 5 pediu 3 cervejas", o Vurio sabe que "João, 34 anos, que aparece toda sexta, pediu sua IPA favorita pela 47ª vez".

Essa profundidade de conhecimento é o que transforma o Vurio de um sistema de pedidos em uma plataforma de relacionamento.

---

*Última atualização: 2026-07-17*
