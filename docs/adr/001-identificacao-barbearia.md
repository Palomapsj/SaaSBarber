# ADR-001: Identificação da barbearia pelo caminho da URL

**Status:** Aceito
**Data:** 2026-11-06
**Decisores:** Paloma Jesus

## Contexto

O sistema é um SaaS multi-tenant: várias barbearias usam a mesma aplicação. O front-end precisa saber de qual barbearia é cada acesso para buscar nome, endereço, serviços, profissionais e horários certos na API.

Forças em jogo:
- O cliente agenda sem conta. Ele chega por um link que a barbearia divulga (Instagram, WhatsApp, cartão), então o link precisa ser curto e fácil de compartilhar.
- O front será hospedado na Vercel (o protótipo já está lá).
- Projeto em fase inicial, com pouca gente para manter infraestrutura.
- Admin e barbeiro fazem login; o perfil e a barbearia deles vêm da autenticação, não da escolha do usuário.

## Decisão

As telas públicas do cliente ficam sob o identificador (slug) da barbearia no caminho da URL:

```
barberagenda.com/novaera                  → Início
barberagenda.com/novaera/agendar/...      → fluxo de agendamento
barberagenda.com/novaera/meus-agendamentos
```

As telas de admin e barbeiro **não** levam o slug na URL. A barbearia vem da sessão do usuário autenticado:

```
barberagenda.com/login
barberagenda.com/admin/...
barberagenda.com/barbeiro/...
```

## Opções consideradas

### Opção A: Subdomínio (`novaera.barberagenda.com`)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Alta: DNS curinga, domínio curinga na Vercel, middleware lendo o host |
| Custo | Exige domínio próprio desde o início; desenvolvimento local precisa de hosts falsos |
| Escalabilidade | Boa |
| Familiaridade da equipe | Baixa |

**Prós:** visual mais "marca própria"; caminho natural para domínio personalizado no futuro.
**Contras:** mais configuração antes da primeira tela; cookies e CORS por subdomínio dão mais trabalho; testar localmente é mais difícil.

### Opção B: Caminho da URL (`barberagenda.com/novaera`) — escolhida

| Dimensão | Avaliação |
|---|---|
| Complexidade | Baixa: uma rota dinâmica `[slug]` no App Router |
| Custo | Nenhum extra; funciona no domínio padrão da Vercel |
| Escalabilidade | Boa: o número de barbearias não muda nada na infraestrutura |
| Familiaridade da equipe | Alta: é roteamento comum do Next.js |

**Prós:** funciona de imediato em produção e local; um só domínio e um só certificado; fácil de testar.
**Contras:** URL menos personalizada; slugs podem colidir com rotas do sistema (`login`, `admin`...); domínio próprio por barbearia exige trabalho extra depois.

## Análise de trade-offs

O ganho do subdomínio é estético e de marca, e só pesa quando houver barbearias pedindo isso. O custo dele aparece já no primeiro dia (DNS, deploy, desenvolvimento local). O caminho entrega o mesmo comportamento funcional com quase nenhuma infraestrutura, e a troca para subdomínio no futuro é possível: o middleware pode reescrever `novaera.barberagenda.com` para `/novaera` sem mudar as telas.

Tirar o slug das rotas de admin e barbeiro evita um problema de segurança: se a barbearia viesse da URL, alguém poderia trocar `/novaera/admin` por `/outra/admin` e depender só da API para bloquear. Vindo da sessão, não há o que trocar. A API continua sendo quem decide (ver CLAUDE.md, seção Autorização).

## Consequências

**Fica mais fácil:**
- Começar a implementar as telas sem configurar DNS.
- Testar localmente (`localhost:3000/novaera`).
- Compartilhar o link da barbearia.

**Fica mais difícil / exige cuidado:**
- **Slugs reservados:** a API não pode aceitar slugs que colidam com rotas do sistema (`login`, `admin`, `barbeiro`, `api`, `_next`, `assets`, `favicon.ico` e afins). A lista precisa existir no back-end, na validação do cadastro.
- **Slug inexistente:** `/qualquercoisa` deve mostrar uma página "Barbearia não encontrada" (404), não um erro.
- **Troca de slug:** se uma barbearia mudar o slug, links antigos quebram. Avaliar redirecionamento do slug antigo quando isso surgir.
- **"Meus agendamentos" é por barbearia:** o cliente vê só os agendamentos daquela barbearia.

**A revisar no futuro:**
- Domínio personalizado por barbearia (ex.: `agenda.barbearianovaera.com.br`), se virar pedido de clientes ou parte de um plano pago.

## Impacto na estrutura de pastas

Ajuste na estrutura proposta do CLAUDE.md:

```
src/app/
  [slug]/              fluxo do cliente (antes: (publico)/)
    page.tsx           Início
    agendar/...
    meus-agendamentos/
    not-found.tsx      Barbearia não encontrada
  (painel)/
    admin/
    barbeiro/
  login/
```

## Itens de ação

1. [ ] Confirmar com o back-end o endpoint para buscar a barbearia pelo slug (ex.: `GET /tenants/{slug}`) e o retorno para slug inexistente.
2. [ ] Definir e implementar no back-end a lista de slugs reservados.
3. [x] Atualizar a estrutura de pastas no CLAUDE.md (`(publico)/` → `[slug]/`).
4. [ ] Criar a rota `src/app/[slug]/` com `not-found.tsx`.
5. [x] Garantir que a sessão de admin/barbeiro traga o identificador da barbearia. Feito na sessão simulada (`barbershopId` no cookie `panel_session`); a sessão real entra no ADR de autenticação.
