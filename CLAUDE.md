# CLAUDE.md — Front-end (Next.js / React / Tailwind)

SaaS de agendamento para barbearias (multi-tenant). Este repositório é só o front-end. A API (C# / .NET / MySQL) fica em outro repositório.

## Regra número um: seguir o protótipo
O protótipo navegável é a referência visual e de fluxo. Implementar exatamente o que ele mostra: layout, espaçamentos, textos, ordem das telas, estados (selecionado, indisponível, ativo/inativo) e comportamento do tema claro/escuro.
- Protótipo publicado: barberagenda-tau.vercel.app
- Código do protótipo: `docs/prototipo/`. HTML estático, cada página com o próprio CSS e JS embutidos. É a fonte para conferir medidas, textos e cores.
- Correspondência tela → arquivo:

| Tela | Arquivo do protótipo |
|---|---|
| Seletor de perfil (só dev) | `index.html` |
| Cliente: Início | `cliente/inicio.html` |
| Cliente: Serviços | `cliente/servicos.html` |
| Cliente: Profissional | `cliente/profissional.html` |
| Cliente: Data e horário | `cliente/data-horario.html` |
| Cliente: Seus dados | `cliente/dados.html` |
| Cliente: Confirmar | `cliente/confirmar.html` |
| Cliente: Sucesso | `cliente/sucesso.html` |
| Cliente: Meus agendamentos | `cliente/agendamentos.html` |
| Admin: Agenda geral | `admin/agenda.html` |
| Admin: Profissionais | `admin/profissionais.html` |
| Admin: Serviços | `admin/servicos.html` |
| Admin: Horários | `admin/horarios.html` |
| Barbeiro: Agenda | `barbeiro/agenda.html` |
| Barbeiro: Meus horários | `barbeiro/horarios.html` |
| Barbeiro: Meus serviços | `barbeiro/servicos.html` |

- Antes de implementar uma tela, ler o arquivo correspondente. Os dados fixos do protótipo (nomes, horários, preços) servem de base para os dados simulados de `lib/api/`.
- `docs/prototipo/` é só referência: não importar nada dele no app nem editar seus arquivos.
- Se algo no protótipo parecer errado ou faltar, **perguntar antes** de inventar. Não "melhorar" o visual por conta própria.

## Stack
- Next.js 16 (App Router) com React 19 e TypeScript em modo `strict`
  - Cache Components está ligado (`cacheComponents` no `next.config.ts`). Esta versão tem APIs diferentes das anteriores: consultar `node_modules/next/dist/docs/` antes de usar uma API do Next (ver `AGENTS.md`).
- Tailwind CSS (usar a versão instalada pelo `create-next-app`)
- Fontes: **Oswald** (títulos, botões, números) e **Work Sans** (texto), via `next/font`
- Não adicionar biblioteca nova sem perguntar (formulários, validação, tema, data fetching, ícones)

## Fase atual: front-end sem back-end
A API ainda não existe. O front é construído primeiro, com dados simulados.
- **API simulada no servidor do Next** (`src/server/mock/`, servida em `/api/mock/...` por `app/api/mock/[...path]/route.ts`). Mesmos caminhos, códigos HTTP e formatos que a API .NET terá; o roteador (`router.ts`) é o contrato vivo.
  - Dados num arquivo local `.data/mock-db.json` (fora do git; `MOCK_DB_FILE` muda o caminho). Para zerar, apague a pasta `.data/`. Dados iniciais em `server/mock/seed.ts`.
  - Rotas `/panel/...` exigem o cookie de sessão e o perfil certo; a barbearia sempre vem da sessão. Rotas `/me/...` do cliente exigem o código de acesso (`Authorization: Bearer`).
  - Erros: `{ error: { code, message, ... } }` com status HTTP; `lib/api/http.ts` transforma em erros tipados (`SlotUnavailableError`, `ValidationError` com `fields`, `PlanLimitError`…).
- **`lib/api/`**: no navegador, funções que chamam a API por `fetch` (`http.ts`, base `/api/mock` ou `NEXT_PUBLIC_API_BASE_URL`). No servidor (páginas, server actions), `lib/api/server.ts` chama o roteador direto, sem HTTP. Quando a API .NET existir, só `lib/api/` muda (base URL e `server.ts`) e `src/server/mock/` é apagado. Componentes nunca importam nada de `src/server/`.
- Tipos da API escritos à mão em `lib/api/types.ts`, até existir o OpenAPI do back-end. Validações de campo compartilhadas entre telas e servidor em `lib/validation/`.
- Agendamentos de exemplo (`server/mock/seededAppointments.ts`): gerados, sempre os mesmos por dia, só para os 3 barbeiros de exemplo (barbeiros criados depois começam com a agenda vazia). São a única fonte de "horário ocupado" além dos agendamentos criados: o que o cliente vê ocupado é exatamente o que o admin vê na agenda.
- Testes: `src/test/setup.ts` liga o `fetch` direto ao roteador e zera a base antes de cada teste; `signInForTest("admin" | "barber")` cria a sessão das rotas do painel. Regras do servidor são testadas em `src/server/mock/*.test.ts`.
- "Reenviar link" simulado: em desenvolvimento, o link que seria enviado pelo WhatsApp aparece no terminal do `npm run dev`.
- Login real fica para depois (ADR de autenticação pendente). Até lá, o seletor de perfil de desenvolvimento define o perfil.

## Perfis e telas
Três perfis. Toda tela abaixo existe no protótipo.

**Cliente** (público, sem conta; layout celular do protótipo abaixo de 768px, tela cheia a partir de 768px — ver Responsividade):
1. Início: nome da barbearia, endereço, horário de funcionamento, botões "Agendar horário" e "Meus agendamentos". Sem foto de fachada e sem link de WhatsApp.
2. Serviços: seleção múltipla agrupada por categoria, com duração e preço; rodapé com total de serviços, tempo e valor.
3. Profissional: opção "Qualquer profissional" + lista de barbeiros.
4. Data e horário: chips de dias, grade de horários (indisponíveis riscados), atalho para lista de espera.
   - Dias: próximos dias de funcionamento numa fileira com rolagem (quantos dias vem da API); dia lotado aparece riscado e não pode ser escolhido.
   - "Qualquer profissional": mostra horários em que algum barbeiro está livre; quem atende é definido pela API ao confirmar.
   - Lista de espera: fluxo ainda não desenhado. O botão fica no lugar do protótipo, desabilitado, com o selo "Em desenvolvimento" sempre visível.
5. Seus dados: nome e WhatsApp, checkbox de agendamento recorrente (ex.: a cada 3 semanas).
6. Confirmar: resumo com total e regra de cancelamento (o prazo vem da configuração da barbearia, não é fixo no código).
7. Sucesso: confirmação, "Adicionar ao calendário", "Ver meus agendamentos".
   - Busca o agendamento pelo código na URL (`?agendamento=`); ao abrir, limpa as escolhas do agendamento e mantém nome e WhatsApp na aba.
   - "Adicionar ao calendário" baixa um arquivo `.ics` (funciona em Apple, Outlook e Google), com repetição quando o agendamento repete.
   - No computador, a mensagem fica num bloco central de até 480px (exceção ao padrão de tela cheia).
8. Meus agendamentos: abas Próximos/Histórico, ações Reagendar e Cancelar.
   - Acesso pelo código do ADR-002. Sem código ou com código inválido: card pedindo o WhatsApp + "Receber link no WhatsApp" (resposta igual para qualquer número). "Sair deste aparelho" no fim da lista.
   - Cancelar pede confirmação no próprio card. Dentro do prazo de cancelamento, Reagendar e Cancelar ficam bloqueados com aviso; quem decide é a API (`canChange`).
   - Reagendar: fluxo ainda não feito; botão desabilitado com o selo "Em desenvolvimento".
   - Histórico: passados ("Concluído", cinza) e cancelados ("Cancelado", vermelho), sem ações.
- Indicador de progresso em 5 passos nas telas 2 a 6.
- As escolhas do cliente entre os passos (serviços, profissional, horário, nome, WhatsApp) ficam no `sessionStorage` da aba, por barbearia, via `useBookingDraft` (`features/agendamento/booking/`). Nunca na URL: nome e WhatsApp são dados pessoais.
- Dados que dependem dessas escolhas (barbeiros que fazem os serviços, horários livres) são buscados no navegador, sempre por funções de `lib/api/`, com estados de carregando, vazio e erro. Sem biblioteca de data fetching por enquanto; reavaliar quando a API existir.
- Se o cliente abrir um passo sem ter feito o anterior (link direto, aba nova), volta automaticamente para o passo que falta. A ordem dos passos e o que cada um exige ficam em um lugar só: `features/agendamento/booking/bookingSteps.ts` (`useBookingStep`).
- Formulários: botão de enviar sempre ativo; o erro aparece embaixo do campo ao sair dele ou ao tentar enviar, e o foco vai para o primeiro campo com erro.
- "Continuar" fica desabilitado enquanto o passo não estiver completo. O rodapé com resumo e "Continuar" fica fixo embaixo quando a lista é longa.

**Admin** (dono, layout desktop com barra lateral de 4 itens): Agenda geral (colunas por barbeiro), Profissionais, Serviços, Horários (com abas para trocar de barbeiro). Mostra o plano e o limite de profissionais.

**Barbeiro** (layout desktop com barra lateral de 3 itens): Agenda (só a dele), Meus horários (só os dele, sem trocar de profissional), Meus serviços (apenas marca/desmarca os que atende; não cria nem edita serviço).

**Login:** o protótipo tem um seletor "Sou Cliente / Barbeiro / Admin" só para navegar. No app real o perfil vem do login. Manter o seletor apenas em ambiente de desenvolvimento, atrás de uma variável de ambiente.

**Painel (admin e barbeiro) — como está feito:**
- `/login` (único para todas as barbearias, por isso o título "Painel da barbearia"): formulário telefone/e-mail + senha e, só com `NEXT_PUBLIC_DEV_PROFILE_SELECTOR=true`, o seletor como atalho que entra direto com um usuário de demonstração.
- Sessão simulada até o ADR de autenticação: cookie `panel_session` `httpOnly`, assinado com HMAC (`SESSION_SECRET`), com perfil, barbearia e `barberId` (`lib/auth/session.ts`). A barbearia do painel vem daqui, nunca da URL.
- `src/proxy.ts` protege `/admin` e `/barbeiro` (sem sessão → `/login?next=…`; perfil errado → a área do próprio perfil). Funções de dados ainda devem checar a sessão por conta própria.
- Contas de demonstração (só simulação), senha `barbearia123` para todas: `dono@barbearianovaera.com` (admin); barbeiros pelo e-mail ou WhatsApp cadastrado, ex. `carlos@barbearianovaera.com` ou `(11) 91234-5678`.
- Layout: `PanelShell` (barra lateral de 84px a partir de 768px; abaixo disso, barra inferior com os mesmos itens + "Sair" e o botão de tema no cabeçalho) e `PanelHeader` (título, subtítulo, iniciais de quem está logado).
- Agenda do admin (`/admin/agenda?dia=AAAA-MM-DD`, sem `dia` = hoje): colunas por barbeiro (ativos + inativos com agendamento no dia), 56px por hora, cor do card pelo primeiro serviço na ordem do catálogo (tokens `event-1` a `event-4`), cancelados não aparecem, clicar no card não faz nada por enquanto. Cards curtos (≈30 min) mostram nome e serviço numa linha. Visão "Semana" fica para depois, com selo "Em desenvolvimento".
- Profissionais (`/admin/profissionais`): lista + formulário (nome, comissão 0–100, WhatsApp, e-mail único, ao menos 1 serviço, ativo). Especialidade = categorias dos serviços (gerada pela API, também vista pelo cliente). Limite do plano conta todos os cadastrados. Remover é recusado com agendamentos futuros (sugere desativar), com confirmação no próprio painel. Novo profissional entra no painel com o e-mail cadastrado (simulação: senha de demonstração). No celular: lista primeiro, formulário com "‹ Voltar à lista".
- Serviços (`/admin/servicos`): lista por categoria (lápis carrega no formulário; padrão "Novo serviço"), formulário com nome (único), categoria em texto livre com sugestões (nome novo cria a categoria; categoria vazia some), duração 5–240 min, preço "45" ou "45,50" (guardado em centavos), profissionais que atendem (mesmo dado da tela Profissionais) e ativo. Sem profissional pode salvar, com aviso. Serviços não são removidos, só desativados. Cliente só vê serviços ativos que algum profissional ativo atende.
- Telas do painel com provider de dados: o provider fica dentro do mesmo `<Suspense>` que o conteúdo (senão os dados chegam antes da hidratação e dá erro de hidratação).
- Agenda do barbeiro (`/barbeiro/agenda?dia=…`): só a do próprio barbeiro (o `barberId` vem da sessão, nunca da URL). Linha do tempo com status pela hora atual (Concluído = já terminou, Em andamento = acontecendo, Confirmado = ainda vai acontecer), atualizada a cada minuto; contador "N agendamentos hoje" ("hoje" só no dia atual). Navegação de dias compartilhada com a do admin (`DayNavigator` + `useAgendaDate`).
- Meus serviços do barbeiro (`/barbeiro/servicos`): só serviços ativos, por categoria, com o interruptor "Eu atendo" que salva na hora (volta se a API recusar). Mesmo dado de Profissionais e Serviços do admin. O último serviço ativo não pode ser desmarcado (API: 409 `LAST_SERVICE`; tela: interruptor travado com aviso). Desmarcar não mexe nos agendamentos já feitos, só nos novos.
- Horários (`/admin/horarios`, abas por profissional; `/barbeiro/horarios`, só os do próprio barbeiro, rota `/panel/me/schedule`): horário semanal (trabalha/folga, das–às, intervalo opcional) e bloqueios (dias inteiros ou algumas horas num dia, com motivo).
  - Padrão de quem nunca editou: horário da barbearia com intervalo 12:00–13:00 (`scheduleRules.defaultWeekly`). O horário do barbeiro fica dentro do horário da barbearia (validação em `lib/validation/schedule.ts`, igual na tela e na API).
  - Semana só vale ao clicar "Salvar horários"; o admin é avisado antes de trocar de aba com alterações não salvas. Bloqueio salva na hora (formulário dentro do card, sem modal).
  - Mudança que deixa agendamentos marcados fora do horário é salva e a API devolve quantos (`outsideCount`); a tela avisa. Os agendamentos não são cancelados.
  - Os horários livres do cliente vêm do horário de cada barbeiro (semana − intervalo − bloqueios). Os agendamentos de exemplo seguem o horário padrão, não o atual.
- Sem desenho no protótipo, com selo "Em desenvolvimento": "Esqueci minha senha", "Trocar foto" do profissional. "Primeiro acesso? Peça o convite ao dono da barbearia" é só texto de orientação.

## Estrutura de pastas (proposta)
A barbearia é identificada pelo caminho da URL nas telas do cliente (`/novaera`, `/novaera/agendar`). Em admin e barbeiro ela vem da sessão, nunca da URL. Ver `docs/adr/001-identificacao-barbearia.md`.
```
src/
  app/
    [slug]/           fluxo do cliente (slug da barbearia)
      not-found.tsx   barbearia não encontrada
    (painel)/
      admin/          layout com PanelShell role="admin"
      barbeiro/       layout com PanelShell role="barber"
    login/            página + server actions (login, devLogin, logout)
  proxy.ts            proteção das rotas do painel
  components/
    ui/               botão, campo, chip, toggle, card (sem regra de negócio)
    layout/           ClientScreen, PanelShell, PanelHeader, navegação do painel
  features/
    agendamento/      componentes, hooks e tipos do fluxo do cliente
    profissionais/
    servicos/
    horarios/
    agenda/
  lib/
    api/              acesso à API (hoje: dados simulados; depois: cliente HTTP tipado)
    auth/
    format/           moeda, data, telefone
    theme/            tema claro/escuro (chave salva, script anti-piscar)
  styles/
docs/
  prototipo/
  adr/                decisões de arquitetura (ler antes de mudar estrutura)
```
- Uma feature por pasta. Componentes de `ui/` não conhecem o domínio.
- Um componente por arquivo, nome em PascalCase. Arquivo passa de ~150 linhas, quebrar.

## Design tokens (fonte única das cores)
Nunca escrever cor em hexadecimal dentro de componente. Usar sempre os tokens abaixo, definidos como variáveis CSS e mapeados no tema do Tailwind. O tema muda pelo atributo `data-theme` (`dark` ou `light`) na tag `<html>`.

| Token | Escuro | Claro |
|---|---|---|
| `bg` | `#121212` | `#F7F5F2` |
| `card` | `#1D1D1D` | `#FFFFFF` |
| `card2` | `#242424` | `#F0ECE7` |
| `text` | `#F2F2F2` | `#1A1816` |
| `muted` | `#9A9A9A` | `#6E6862` |
| `muted2` | `#6E6E6E` | `#9C948C` |
| `border` | `#2C2C2C` | `#E4DED6` |
| `accent` | `#E3242B` | `#E3242B` |
| `accent-soft` | `rgba(227,36,43,0.16)` | `rgba(227,36,43,0.10)` |
| `on-accent` | `#FFFFFF` | `#FFFFFF` |
| `success` | `#3DDC84` | `#1D9A5C` |
| `success-soft` | `rgba(61,220,132,0.16)` | `rgba(29,154,92,0.12)` |
| `event-1` a `event-4` | `#E3242B`, `#4FA3E3`, `#E3B324`, `#8B5CF6` | iguais | 

- `event-1` a `event-4`: cores dos cards da agenda do admin (protótipo admin/agenda.html). Fundo do card com 13% de opacidade (`bg-event-N/13`) e faixa à esquerda na cor cheia.

- Vermelho (`accent`) é a identidade da marca e não muda entre os temas.
- Tema padrão: escuro. A escolha do usuário é salva no `localStorage` e aplicada antes da primeira renderização, para não piscar o tema errado.
- Toda tela precisa ter o botão de alternar tema (sol/lua), como no protótipo.
- Cores de status e de serviços na agenda do admin seguem o protótipo; se precisar de uma cor nova, perguntar.

## Convenções de código
- Textos exibidos ao usuário em português (pt-BR). Código, nomes e commits em inglês.
- Server Components por padrão. `"use client"` só onde há interação ou estado do navegador.
- Sem `any`. Tipos do que vem da API ficam em um lugar só (idealmente gerados da documentação OpenAPI do back-end).
- Dinheiro, data e telefone sempre formatados por funções de `lib/format` (`Intl`, fuso America/Sao_Paulo). O back-end devolve datas em UTC.
- Nada de regra de negócio no componente. Regras (antecedência mínima, prazo de cancelamento, limites do plano) vêm do back-end.
- Estados de carregamento, vazio e erro em toda tela que busca dados.
- Nomes que dizem o que a coisa é. Sem comentário que repete o código; comentar só o "porquê".

## Autorização
- O front esconde o que o perfil não pode ver, mas **quem decide é a API**. Nunca confiar só na interface.
- Rotas de `/admin` e `/barbeiro` protegidas por middleware conforme o perfil do usuário autenticado.
- Barbeiro nunca vê agenda, horários ou serviços de outro barbeiro. Admin vê tudo.
- Cliente agenda sem conta (nome + WhatsApp) e só vê os próprios agendamentos.
- Acesso do cliente a "Meus agendamentos": link mágico no WhatsApp + código de acesso salvo no aparelho + "Reenviar link". No aparelho fica só o código, nunca nome ou telefone. Ver `docs/adr/002-acesso-cliente-sem-conta.md`.

## Acessibilidade
- Todo campo com `label` associado. Todo botão só com ícone com `aria-label` (voltar, tema, sair, editar, remover).
- Alvos de toque de pelo menos 44px nas telas do cliente.
- Campos de texto com letra de 16px (o protótipo usa 14px): abaixo disso o iPhone dá zoom ao tocar no campo.
- Contraste de texto suficiente nos dois temas. Foco visível em tudo que é clicável.
- Estado nunca só por cor: indisponível = riscado + cor; selecionado = cor + borda/ícone.

## Responsividade
- Telas do cliente: mobile primeiro, sempre dentro de `ClientScreen` (`components/layout`).
  - Abaixo de 768px (`md`): layout celular do protótipo (coluna de até 480px, com sombra em celulares grandes).
  - A partir de 768px: tela cheia. Linhas divisórias e rodapé ocupam a largura toda; o conteúdo usa a classe `content-width` (até 1100px, centralizado) e se reorganiza em colunas (serviços e barbeiros em 2–3 colunas, horários em 6, formulário em 2, resumo + aviso lado a lado). O rodapé vira uma barra: resumo à esquerda, botão (320px) à direita.
  - O protótipo não tem a versão para computador; mudanças nela seguem esse padrão ou são perguntadas antes.
- Telas de admin e barbeiro: a partir de 768px, barra lateral de 84px + conteúdo (protótipo). Abaixo de 768px: barra inferior fixa com os itens + "Sair", botão de tema no cabeçalho, conteúdo em uma coluna; nada pode passar da largura da tela (tabelas e grades largas rolam para o lado dentro do próprio bloco, como a agenda, que encaixa a rolagem em cada barbeiro). Toda tela nova do painel é conferida em 375px antes de dizer que terminou.

## Testes
- Testes de componente para o que tem lógica (seleção de serviços, grade de horários, formulário de dados).
- Um teste de ponta a ponta cobrindo o fluxo completo do cliente, do início ao sucesso.
- Teste novo junto com toda regra de interface nova.

## Como trabalhar neste repositório
- Para mudanças que mexem em mais de um arquivo, mostrar o plano antes de editar.
- Uma tela ou funcionalidade por vez, em mudanças pequenas e fáceis de revisar.
- Comparar o resultado com a tela correspondente do protótipo antes de dizer que terminou.
- Rodar lint, checagem de tipos e testes antes de dizer que terminou.

## Comandos
```
npm run dev      # servidor local em http://localhost:3000
npm run build
npm run lint
npm run typecheck
npm run test
```
