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

## D011 — Dois modos de operação: Autônomo e Assistido

- **Data**: 2026-07-17
- **Motivo**: Estabelecimentos têm perfis operacionais diferentes. Alguns vão eliminar o garçom completamente; outros vão manter o garçom, mas com função reduzida (entregador e relacionamento, não anotador). O produto precisa suportar ambos sem bifurcar o desenvolvimento.
- **Impacto**:
  - **Modo Autônomo**: cliente faz todo o pedido pelo app; staff prepara e entrega
  - **Modo Assistido**: garçom pode lançar pedido pelo painel em nome de um cliente identificado por CPF; cliente pode ter pedido tanto pelo app quanto via garçom
  - O cardápio, a cozinha, o histórico e a conta são **idênticos nos dois modos**
  - O estabelecimento configura o modo preferido, podendo usar os dois simultaneamente
  - Feature necessária: campo no painel do Corredor/Entregador para "Lançar pedido para cliente"
- **Alternativas consideradas**: Produto exclusivamente autônomo (descartado: limita adoção por estabelecimentos com cultura de garçom forte)

---

## D012 — CPF mascarado para garçons no Modo Assistido (LGPD)

- **Data**: 2026-07-17
- **Motivo**: O garçom é um funcionário do estabelecimento, não um operador de dados autorizado a visualizar CPF completo. Pelo princípio da **necessidade mínima** (LGPD Art. 6º, inciso III), o garçom precisa apenas confirmar que está atendendo a pessoa certa — não precisa do CPF completo para isso.
- **Impacto**:
  - O painel do Corredor/Entregador **nunca exibe o CPF completo** de nenhum cliente
  - Para identificação no Modo Assistido, o sistema exibe: **Nome completo + CPF parcialmente mascarado**
  - Formato de exibição: `João Silva — ***.***-XXX-**` (apenas os 3 dígitos centrais visíveis)
  - O garçom confirma verbalmente com o cliente os dígitos visíveis antes de lançar o pedido
  - CPF completo fica acessível **apenas** ao Dono/Admin, e somente em relatórios com justificativa de acesso
- **Regra permanente**: Nenhuma tela voltada a funcionários operacionais (cozinha, bar, corredor) exibe CPF completo. Jamais.
- **Alternativas consideradas**: Exibir CPF completo para agilidade (descartado: viola LGPD e expõe o estabelecimento a risco legal)

---

## D013 — Políticas de Privacidade e Termos de Uso (LGPD) em Produção vs. Testes

- **Data**: 2026-07-17
- **Motivo**: A coleta de CPF exige amparo legal. Para testes internos conduzidos pelo fundador e pessoas próximas, o termo pode ser flexibilizado ou dispensado temporariamente. Contudo, em produção e para o mercado externo, o sistema não aceitará nenhum cadastro sem a concordância explícita da Política de Privacidade e Termos de Uso.
- **Impacto**:
  - Em ambiente de testes (dev/staging local), o fluxo do chatbot pode bypassar o consentimento explícito se configurado em env flags.
  - Para produção, o checkout/cadastro de cliente é bloqueado até que o checkbox/opt-in de termos de uso e política de privacidade esteja gravado.

---

## D014 — Validação Matemática de CPF

- **Data**: 2026-07-17
- **Motivo**: Prevenir cadastros com CPFs falsos que poluiriam o histórico de clientes e o multi-tenant.
- **Impacto**:
  - Implementação de validador matemático de CPF baseado em módulo 11 (dígitos verificadores) tanto no frontend (chatbot web) quanto nas validações de schema/serviço no backend.
  - O sistema retornará erro explícito informando CPF inválido caso o cálculo matemático falhe.

---

## D015 — Controle de Acesso por PIN para Cozinha/Bar/Corredor

- **Data**: 2026-07-17
- **Motivo**: Evitar vazamento de informações operacionais e manipulação indevida de pedidos. O acesso via URL com slug é aceito temporariamente apenas em desenvolvimento/testes internos.
- **Impacto**:
  - Telas de Cozinha, Bar e Corredor exigirão um PIN numérico rápido de 4 dígitos configurado pelo Admin/Dono para cada função.
  - Sessão de login expira após período configurado de inatividade.

---

## D016 — Bloqueio de Funcionários sem Exclusão do Histórico

- **Data**: 2026-07-17
- **Motivo**: Caso um funcionário seja demitido ou afastado, o sistema precisa bloquear seu acesso imediatamente sem excluir seu cadastro (possibilitando recontratação futura ou auditoria de quem entregou o quê).
- **Impacto**:
  - Adicionado o status `bloqueado` ou flag `ativo (false)` na entidade de usuários administrativos.
  - O bloqueio impede a geração de novos tokens de sessão. O histórico de entregas/preparos vinculados ao usuário administrativo permanece intacto para fins de relatórios do Dono.

---

## D017 — Prevenção de Pedidos Fora do Horário (Abertura e Fechamento de Turno)

- **Data**: 2026-07-17
- **Motivo**: Evitar pedidos falsos enviados remotamente quando o estabelecimento está fechado.
- **Impacto**:
  - O Dono/Admin gerencia a abertura e o fechamento do turno/expediente através do painel.
  - Quando fechado, o QR Code de mesas do restaurante redirecionará para uma página estática informando que o estabelecimento está fechado e o chatbot não registrará novos pedidos.

---

## D018 — Validação de Preço de Itens no Fechamento do Pedido

- **Data**: 2026-07-17
- **Motivo**: Conforme o Código de Defesa do Consumidor brasileiro, o valor que conta é o do fechamento/confirmação. Se o estabelecimento mudar o preço no admin enquanto o cliente está montando o carrinho, o preço de quando o cliente enviou o pedido deve prevalecer.
- **Impacto**:
  - O carrinho carrega a referência do produto.
  - No momento em que a API de criação de pedido é disparada, o preço unitário do item é gravado permanentemente na tabela `orderItems`, persistindo aquele valor histórico independente de atualizações subsequentes na tabela `menuItems`.

---

## D019 — Proteção contra Spam/Flood de Pedidos

- **Data**: 2026-07-17
- **Motivo**: Evitar ataques maliciosos de negação de serviço ou spam de pedidos na cozinha.
- **Impacto**:
  - Implementação de limites de requisição baseados em IP e CPF (máximo de 5 pedidos a cada 10 minutos por CPF ativo no mesmo estabelecimento, ajustável pelo Admin).
  - Rate limiting ativo nas rotas do chatbot e criação de pedidos.

---

## D020 — Retenção de Dados: 5 Anos Fiscal e 180 Dias Chat

- **Data**: 2026-07-17
- **Motivo**: Cumprimento das obrigações fiscais brasileiras de manter histórico de transações por 5 anos, equilibrado com a privacidade do usuário (minimizando o armazenamento das mensagens brutas de chat).
- **Impacto**:
  - Histórico de pedidos, clientes e financeiros é mantido no banco de dados operacional por 5 anos.
  - Mensagens brutas do chat da sessão (`chatMessages` e transcrições) serão excluídas automaticamente por um job cron em D+180 após a sessão ser encerrada.

---

## D021 — Confirmação de Maioridade para Itens Restritos

- **Data**: 2026-07-17
- **Motivo**: Impedir legalmente a venda de álcool a menores de 18 anos.
- **Impacto**:
  - Itens de menu com categoria de álcool possuem flag `ageRestricted`.
  - Ao pedir um item com essa restrição pela primeira vez, o chatbot exige do cliente a confirmação explícita de maioridade. Isso é gravado com timestamp no histórico do cliente.
  - O garçom/entregador receberá um alerta visual no painel para realizar a verificação de documento físico na entrega.

---

## D022 — Estratégia de WhatsApp API: Não-Oficial para Testes, Oficial da Meta para Produção

- **Data**: 2026-07-17
- **Motivo**: Rapidez e facilidade nos testes iniciais, mas garantia de estabilidade e compliance da Meta para estabelecimentos reais em produção através de parceria comercial já existente na empresa do fundador.
- **Impacto**:
  - Usaremos API não-oficial nos testes de desenvolvimento.
  - O plano de homologação do primeiro bar piloto prevê a configuração de um número oficial na Meta Cloud API.

---

## D023 — Redundância de Internet e Cache Local

- **Data**: 2026-07-17
- **Motivo**: Minimizar impacto de instabilidade de rede local do restaurante.
- **Impacto**:
  - O estabelecimento é orientado a ter conexão secundária.
  - O frontend do cardápio utilizará Service Workers para cachear as imagens, informações de itens e dados estáticos locais, garantindo que o cardápio abra mesmo sob internet oscilante.

---

## D024 — Autenticação via Supabase Auth e Provedores Sociais

- **Data**: 2026-07-17
- **Motivo**: Substituir o Manus OAuth da plataforma de origem por uma solução nativa, segura e escalável do Supabase que suporta provedores sociais (Google, Facebook, Instagram, etc.).
- **Impacto**:
  - Tanto o painel administrativo (Dono) quanto possíveis autenticações futuras de clientes utilizarão o Supabase Auth.
  - O fluxo de login social no admin redirecionará o usuário e salvará a sessão no JWT/Cookie seguro do Supabase Client.
  - O cadastro básico de clientes via chatbot continuará não exigindo autenticação social pesada no primeiro acesso (apenas CPF/nome com consentimento LGPD), mas o login social poderá ser associado ao CPF posteriormente como camada de segurança.

---

## D025 — Módulo de Gestão de Estoque (Inventory Control)

- **Data**: 2026-07-17
- **Motivo**: O chatbot de IA e o menu do cliente precisam respeitar a disponibilidade real de produtos em estoque, evitando vendas de itens esgotados. O administrador precisa de controle gerencial e auditoria manual do fluxo de mercadorias.
- **Impacto**:
  - **Tabelas atualizadas**: `menuItems` ganha campos `trackStock` (boolean), `stockQuantity` (integer/decimal) e `lowStockThreshold` (integer).
  - **Nova tabela**: `inventoryTransactions` para logar todas as entradas e saídas de estoque (venda automática, ajuste manual, desperdício/quebra, reabastecimento).
  - **Redução Automática**: Ao confirmar um pedido (checkout), o estoque do item é deduzido automaticamente.
  - **Inteligência do Chatbot**: O prompt da IA é alimentado em tempo real apenas com itens em estoque (`stockQuantity > 0` ou `trackStock = false`). O chatbot avisa o cliente se o item acabar durante a conversa.
  - **Alertas de Estoque Baixo**: O painel administrativo receberá alertas em tempo real e notificações quando um produto atingir o `lowStockThreshold`.

---

## D026 — Versionamento Visível Obrigatório nas Interfaces

- **Data**: 2026-07-20
- **Motivo**: Permitir que o fundador e a equipe validem visualmente e de forma inequívoca que o navegador está exibindo a versão mais recente do código e das correções aplicadas, eliminando dúvidas causadas por cache de navegador ou devserver.
- **Impacto**:
  - Arquivo `src/lib/version.ts` criado contendo `APP_VERSION` e `LAST_UPDATED`.
  - Exibição visual da versão no rodapé do cartão de login do Admin (`/admin`), no header da Cozinha (`/kitchen`), no Chatbot (`/chat`) e na Landing Page (`/`).
  - Regra obrigatória: Toda nova alteração no projeto DEVE atualizar a versão e a data/hora em `src/lib/version.ts`.

---

*Última atualização: 2026-07-20*

