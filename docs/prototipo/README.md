# Barbearia Nova Era — Protótipo navegável

Site estático (HTML + CSS + JS puro, sem build, sem dependências) com o protótipo completo:
perfil **Cliente**, **Barbeiro** e **Admin**, com toggle de modo claro/escuro funcional.

## Estrutura

```
index.html          → tela de entrada, com o seletor Cliente / Barbeiro / Admin
cliente/             → fluxo público de agendamento (8 telas)
admin/                → painel do dono da barbearia (4 telas)
barbeiro/             → área do profissional (3 telas)
```

Cada página é autossuficiente: o CSS (cores dark/light, estilos base) e o JS do toggle
de tema já vêm embutidos dentro do próprio `.html`, então não há pastas `css/` ou `js/`
soltas — dá pra abrir qualquer arquivo isoladamente, fora da estrutura de pastas, que o
visual não quebra.

## Rodar localmente

Não precisa de nada instalado além de um navegador. Duas opções:

1. Abra `index.html` direto no navegador (duplo clique).
2. Ou, se preferir um servidor local (recomendado, evita bloqueios de caminho relativo):
   ```bash
   npx serve .
   ```

## Deploy no Vercel

**Opção mais rápida — arrastar e soltar:**
1. Acesse https://vercel.com/new
2. Arraste esta pasta inteira pro navegador (ou clique em "Upload" e selecione a pasta)
3. Confirme — não precisa configurar build command nem output directory, é site estático puro

**Opção via CLI:**
```bash
npm i -g vercel
cd caminho/para/esta/pasta
vercel
```
Siga as perguntas do terminal (aceite os padrões — o Vercel detecta como projeto estático automaticamente).

**Opção via GitHub:**
1. Suba esta pasta pra um repositório novo no GitHub
2. Em https://vercel.com/new, importe o repositório
3. Deploy automático a cada push

## O que ainda é só protótipo (não funcional de verdade)

- Não há back-end: nenhum dado é salvo, os agendamentos/horários exibidos são fixos (mock)
- O login não autentica — o seletor de perfil na tela inicial é só pra navegar entre as experiências
- Toggles (ativo/inativo, checkboxes, chips) são visuais; não persistem estado entre páginas
