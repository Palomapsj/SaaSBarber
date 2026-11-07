# ADR-002: Acesso do cliente sem conta a "Meus agendamentos"

**Status:** Aceito
**Data:** 2026-11-06
**Decisores:** Paloma Jesus

## Contexto

O cliente agenda sem criar conta, informando só nome e WhatsApp. A tela "Meus agendamentos" (ver, reagendar e cancelar) precisa saber de quem são os agendamentos, sem login e sem senha.

Forças em jogo:
- Cancelar ou reagendar é uma ação sensível: só o dono do agendamento pode fazer. O número do agendamento sozinho não pode dar acesso, senão alguém cancelaria o agendamento de outra pessoa trocando o número.
- O WhatsApp já é o canal de confirmação. Só o dono do número recebe as mensagens.
- Clientes voltam a cada poucas semanas (inclusive com repetição automática), muitas vezes de outro aparelho ou navegador.
- Agendamentos também podem ser criados pela barbearia em nome do cliente (por telefone, repetições automáticas) e precisam aparecer para ele.
- No iPhone, o Safari apaga dados salvos de sites não visitados por 7 dias.
- Decisão anterior: nome e WhatsApp do cliente não ficam salvos no aparelho (só na aba durante o agendamento).
- A API (.NET) fica em outro domínio; o front ainda não tem back-end próprio.

## Decisão

Usar **as duas formas juntas**:

1. **Link mágico (forma principal e de recuperação).** Cada mensagem de confirmação no WhatsApp traz um link pessoal:
   `https://<domínio>/<slug>/meus-agendamentos?acesso=<código>`
   Quem abre o link vê e gerencia os agendamentos daquele WhatsApp naquela barbearia.
2. **Lembrar neste aparelho (atalho).** Ao confirmar um agendamento, a API devolve o mesmo tipo de código, e o navegador o guarda. "Ver meus agendamentos" funciona na hora, sem abrir o WhatsApp.
3. **Reenviar link.** Em "Meus agendamentos", quem está sem código informa o WhatsApp e recebe um novo link.

O que fica no aparelho é **só o código de acesso**: nunca nome ou telefone. A decisão de não guardar dados pessoais no aparelho continua valendo.

## Opções consideradas

### Opção A: Só link mágico

| Dimensão | Avaliação |
|---|---|
| Complexidade | Média |
| Custo | Envio de mensagem por WhatsApp (já necessário para a confirmação) |
| Escalabilidade | Boa |
| Familiaridade da equipe | Média (já há experiência com API de WhatsApp) |

**Prós:** funciona em qualquer aparelho; prova que a pessoa é dona do WhatsApp; mostra agendamentos criados pela barbearia; nada fica no aparelho.
**Contras:** se a mensagem não chegar ou for apagada, o cliente fica sem acesso; logo depois de agendar, precisa sair do site e abrir o WhatsApp para ver os agendamentos; link encaminhado dá acesso a quem receber.

### Opção B: Só lembrar neste aparelho

| Dimensão | Avaliação |
|---|---|
| Complexidade | Baixa |
| Custo | Nenhum extra |
| Escalabilidade | Boa |
| Familiaridade da equipe | Alta |

**Prós:** zero atrito; não depende do envio de mensagens; pouco trabalho no back-end.
**Contras:** só funciona no mesmo aparelho e navegador; perde tudo ao limpar o navegador, em janela anônima ou após 7 dias sem visita no iPhone; não prova quem é a pessoa; em aparelho compartilhado, qualquer um vê e cancela; não mostra agendamentos criados pela barbearia.

### Opção C: Código por WhatsApp (tipo "login sem senha")

O cliente digita o número e recebe um código de 6 dígitos para entrar. Mais segura, mas exige uma tela e um passo a mais toda vez, e não existe no protótipo. Descartada por enquanto; o "Reenviar link" cobre o caso de recuperação com menos atrito.

### Opção D (escolhida): A + B juntas

Cada uma cobre o buraco da outra: o aparelho dá acesso imediato e sem atrito; o link funciona em qualquer aparelho e recupera o acesso quando o código salvo se perde.

## Análise de trade-offs

- **Segurança vs. atrito:** o link mágico prova a posse do WhatsApp sem pedir nada ao cliente. O código salvo no aparelho é tão forte quanto o link (é o mesmo tipo de código), mas vale para quem estiver com o aparelho. O botão "Sair deste aparelho" reduz o risco em aparelho compartilhado.
- **Código no navegador vs. cookie protegido:** guardar o código no armazenamento do navegador é simples, mas um script malicioso na página conseguiria lê-lo. Um cookie protegido (`httpOnly`) seria mais seguro, mas a API está em outro domínio e os navegadores bloqueiam cada vez mais esse tipo de cookie; resolver isso exige um back-end no próprio front (rotas do Next fazendo ponte para a API). Fica para o ADR de autenticação, que tem o mesmo problema para admin e barbeiro. Até lá: nenhum script de terceiros nas telas do cliente e política de segurança de conteúdo (CSP) restritiva.
- **Dependência do WhatsApp:** se o envio falhar, o atalho do aparelho ainda funciona para quem agendou nele, e o "Reenviar link" permite tentar de novo.

## Contrato proposto com a API

Detalhes finais são do back-end; o front espera o seguinte:

| Ação | Chamada | Observações |
|---|---|---|
| Confirmar agendamento | `POST /barbershops/{id}/appointments` | Resposta inclui `clientAccess: { token, expiresAt }` além do agendamento. |
| Ver meus agendamentos | `GET /barbershops/{id}/me/appointments` com `Authorization: Bearer <token>` | `401` se o código for inválido, expirado ou revogado. Sem efeitos colaterais (o WhatsApp abre links sozinho para gerar a prévia). |
| Cancelar / reagendar | `POST` com o mesmo cabeçalho | Sempre por ação explícita do cliente (toque + confirmação), nunca só por abrir o link. |
| Reenviar link | `POST /barbershops/{id}/client-access/resend` com `{ phone }` | Responde sempre `202`, exista o número ou não (não revela quem é cliente). Limite de tentativas por número e por IP. |
| Sair deste aparelho | Só no front (apaga o código salvo) | Opcional: `DELETE` para revogar o código no servidor. |

**Código de acesso:**
- Aleatório, com pelo menos 256 bits (ex.: 43 caracteres em base64url). Não deriva de telefone, nome ou data.
- Guardado no banco só como hash (ex.: SHA-256); o código em texto só existe no link e no aparelho do cliente.
- Vale para um WhatsApp em uma barbearia (`barbershopId + telefone`).
- Expira 30 dias depois do último agendamento do cliente (renova a cada novo agendamento) e pode ser revogado.

## Comportamento no front

- **Ao confirmar:** guardar `clientAccess.token` no navegador, por barbearia (chave `client-access:<slug>`).
- **Ao abrir o link mágico:** ler `?acesso=`, validar com a API, guardar no aparelho e **tirar o código da URL** (para não ficar no histórico nem ser copiado junto com o endereço).
- **Código salvo inválido (`401`):** apagar e mostrar a opção "Reenviar link".
- **"Sair deste aparelho":** em "Meus agendamentos", apaga o código salvo.
- **Sem código:** "Meus agendamentos" mostra só a opção de reenviar o link pelo WhatsApp.

## Consequências

**Fica mais fácil:**
- Ver os agendamentos logo depois de agendar, sem sair do site.
- Acessar de outro aparelho pelo link da mensagem.
- Mostrar agendamentos criados pela barbearia e as repetições automáticas.

**Fica mais difícil / exige cuidado:**
- O back-end precisa gerar, guardar (como hash), validar, expirar e revogar códigos, e enviar o link no WhatsApp.
- Link encaminhado dá acesso a quem receber; mitigado por validade, revogação e confirmação antes de cancelar.
- "Meus agendamentos" ganha estados que não estão no protótipo: sem acesso, reenviar link, link inválido e "sair deste aparelho". O visual deles precisa ser definido antes de implementar.
- O código no navegador pode ser lido por um script malicioso na página: manter as telas do cliente sem scripts de terceiros.

**A revisar no futuro:**
- Trocar o armazenamento no navegador por cookie protegido quando o front tiver rotas próprias fazendo ponte para a API (ADR de autenticação).
- Login por código de 6 dígitos (opção C), se a barbearia pedir mais segurança.

## Itens de ação

**Front-end**
1. [x] Simular no `lib/api/` o código de acesso (devolvido ao confirmar), a listagem dos agendamentos por código e o reenvio.
2. [x] Guardar o código no aparelho ao confirmar e ao abrir o link mágico (só depois de a API aceitar o código); tirar `?acesso=` da URL.
3. [x] Definir o visual dos estados novos de "Meus agendamentos" (sem acesso, reenviar link, sair deste aparelho).
4. [x] Implementar "Meus agendamentos" (abas Próximos/Histórico, Cancelar). Reagendar fica para a próxima entrega.

**Back-end**
5. [ ] Criar a tabela de códigos de acesso (hash, barbearia, telefone, validade, revogado).
6. [ ] Devolver `clientAccess` ao confirmar e incluir o link mágico na mensagem do WhatsApp.
7. [ ] Endpoints de listagem, cancelamento/reagendamento por código e reenvio, com limite de tentativas.
