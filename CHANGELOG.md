# CHANGELOG — Vurio Application

Todas as alterações relevantes do projeto são registradas neste arquivo.

## [v1.0.1] - 2026-07-20
### Adicionado
- **D026 — Versionamento Visível Obrigatório**: Criado o modulo `src/lib/version.ts` e inseridos badges de versão visíveis no rodapé/cabeçalho de todas as telas (`/admin`, `/chat`, `/kitchen` e `/`).
- **Feedback de Login In-App**: Adicionadas caixas de mensagens visualmente destacadas (em vermelho e verde) na tela de autenticação do Admin para exibir erros e confirmações de cadastro sem depender de alertas do navegador.

### Alterado
- **Centralização de Validações de Autenticação**: O formulário de login no `/admin` ganhou o alternador explicativo para alternar entre "Entrar com Email" e "Criar Conta".

---

## [v1.0.0] - 2026-07-17
### Adicionado
- **Migração para Next.js 16 + Supabase + PostgreSQL + Google Gemini 2.5-flash**:
  - Tabela de Produtos com Módulo de Estoque (D025).
  - Triggers no PostgreSQL para decremento de estoque em tempo real.
  - Chatbot com extração nativa de intenções via JSON Schema do Gemini 2.5-flash.
  - Painel de Cozinha com Alertas Sonoros e PIN operacional.
