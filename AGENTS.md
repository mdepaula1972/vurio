<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Regras Obrigatórias do Desenvolvedor (Vurio)

## 📌 Regra de Versionamento Visível Obrigatório (D026)
Toda e qualquer alteração no código (seja correção de bug, refinamento de UI, ajuste de backend ou nova funcionalidade) **DEVE obrigatoriamente**:
1. Incrementar a versão e atualizar a data/hora no arquivo [`src/lib/version.ts`](file:///D:/vurio/src/lib/version.ts).
2. Registrar o resumo da alteração no [`CHANGELOG.md`](file:///D:/vurio/CHANGELOG.md).
3. Garantir que a versão continue visível no rodapé das telas principais (/admin, /chat, /kitchen e /).

