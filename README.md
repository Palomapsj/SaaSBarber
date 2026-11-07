# Barbershoop — front-end

Agendamento online para barbearias (SaaS multi-tenant). Este repositório é só o front-end, em Next.js. A API (C# / .NET / MySQL) fica em outro repositório e ainda não existe: por enquanto o front usa uma **API simulada** que roda no próprio servidor do Next.

Três perfis:

- **Cliente** (sem conta): escolhe serviços, profissional, data e horário, informa nome e WhatsApp e confirma. Também vê e cancela os próprios agendamentos.
- **Admin** (dono da barbearia): agenda geral, profissionais, serviços e horários de trabalho.
- **Barbeiro**: a própria agenda, os próprios horários e os serviços que atende.

## Pré-requisitos

- Node.js 20.9 ou mais novo (testado com o 26)
- npm

## Como rodar

```bash
npm install
cp .env.example .env.local   # no PowerShell: Copy-Item .env.example .env.local
```

Preencha `SESSION_SECRET` no `.env.local` com pelo menos 32 caracteres aleatórios (o `.env.example` mostra um comando para gerar). Depois:

```bash
npm run dev
```

Abra no navegador:

| Endereço | O que é |
|---|---|
| http://localhost:3000/novaera | Tela inicial do cliente da barbearia de exemplo |
| http://localhost:3000/login | Painel (admin e barbeiro) |

### Contas de demonstração

Todas com a senha `barbearia123` (só existem na simulação):

| Perfil | Login |
|---|---|
| Admin | `dono@barbearianovaera.com` |
| Barbeiro | `carlos@barbearianovaera.com` ou `(11) 91234-5678` |

Com `NEXT_PUBLIC_DEV_PROFILE_SELECTOR=true`, a tela de login também mostra os atalhos "Sou Cliente / Sou Barbeiro / Sou Admin", que entram direto sem digitar senha. Só para desenvolvimento.

## Comandos

```bash
npm run dev        # servidor local em http://localhost:3000
npm run build      # build de produção
npm run lint       # ESLint
npm run typecheck  # tipos das rotas + TypeScript
npm run test       # testes (Vitest + Testing Library)
```

Antes de considerar uma mudança pronta: `lint`, `typecheck` e `test` passando.

## API simulada

- Fica em `src/server/mock/` e responde em `/api/mock/...`, com os mesmos caminhos, códigos HTTP e formatos que a API .NET terá. O roteador (`src/server/mock/router.ts`) é o contrato.
- Os dados ficam no arquivo `.data/mock-db.json` (fora do git). **Para voltar aos dados iniciais, apague a pasta `.data/`.**
- As telas só falam com a API por `src/lib/api/`. Quando a API .NET existir, muda só essa pasta e `src/server/mock/` é apagado.
- "Reenviar link" do cliente: em desenvolvimento, o link que iria pelo WhatsApp aparece no terminal do `npm run dev`.

## Stack

Next.js 16 (App Router, Cache Components), React 19, TypeScript strict, Tailwind CSS 4, Vitest. Fontes Oswald e Work Sans. Tema claro/escuro.

## Estrutura

```
src/
  app/           rotas: [slug]/ (cliente), (painel)/admin, (painel)/barbeiro, login, api/mock
  components/    ui/ (botões, campos…) e layout/ (ClientScreen, PanelShell…)
  features/      uma pasta por funcionalidade: agendamento, agenda, profissionais, servicos, horarios
  lib/           api/ (acesso à API), auth/, format/, validation/, theme/
  server/mock/   API simulada (só servidor)
docs/
  prototipo/     protótipo navegável (HTML), referência visual de todas as telas
  adr/           decisões de arquitetura
```

## Documentação

- **`CLAUDE.md`**: regras do projeto (seguir o protótipo, tokens de cor, acessibilidade, responsividade, convenções). Leia antes de mexer.
- **`docs/prototipo/`**: como cada tela deve ficar. Abra `docs/prototipo/index.html` no navegador.
- **`docs/adr/`**: por que a barbearia vem na URL do cliente, como o cliente acessa os agendamentos sem conta, entre outras decisões.

## Situação

Prontas: as 8 telas do cliente e as telas do painel (login, agenda, profissionais, serviços, horários, meus serviços), no celular e no computador.

Ainda não feitas (aparecem com o selo "Em desenvolvimento"): lista de espera, reagendar, visão semanal da agenda, "Esqueci minha senha", trocar foto do profissional. Também falta o login real (hoje a sessão é simulada) e a integração com a API .NET.
