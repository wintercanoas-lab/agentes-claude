# agentes-claude
AGENTES DE IA

## Time de Tráfego Pago — Meta Ads (v1.1.1)

Seis agentes do Claude Code já instalados em `.claude/agents/`:

| Agente | Nome | O que faz |
|--------|------|-----------|
| `@traffic-analyst` | Trace 📊 | Analisa performance de campanhas |
| `@budget-optimizer` | Buck 💰 | Otimiza orçamento (escalar/pausar) |
| `@creative-reviewer` | Cris 🎨 | Revisa criativos e detecta saturação |
| `@report-writer` | Rex 📋 | Relatórios semanais/mensais |
| `@ad-creator` | Ada ✍️ | Textos de anúncio e variações A/B |
| `@creative-director` | Cleo 🎬 | Briefs de vídeo para gravar |

### Primeiro uso na sua máquina

```bash
git clone https://github.com/wintercanoas-lab/agentes-claude.git
cd agentes-claude
node instalar.js   # instala dependências e cria o .env com suas credenciais Meta
claude             # abre o Claude Code com os agentes
```

Depois, dentro do Claude Code: `@traffic-analyst *analisar`

O arquivo `.env` (com seu token) fica só na sua máquina e nunca é enviado ao GitHub.
Guia completo: [LEIA-ME.md](LEIA-ME.md).
