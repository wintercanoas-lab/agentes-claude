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

### 🔒 Trava de segurança

Os agentes **nunca alteram nada na sua conta de anúncios sem o seu "sim"**: criar, pausar, ativar ou mudar orçamento.
1. Eles mostram o plano (o que muda, antes → depois, quanto passa a gastar) e perguntam **"Posso aplicar?"**.
2. Só depois do seu "sim" eles aplicam, pelo `scripts/aplicar.js`.
3. Mesmo assim, o Claude Code mostra um pedido de aprovação na tela (`.claude/hooks/trava-meta.js`). Se você não aprovar, nada acontece.
4. O código que fala com a Meta (`lib/meta-ads-client.js`) também recusa qualquer alteração sem essa confirmação.

O arquivo `.env` (com seu token) fica só na sua máquina e nunca é enviado ao GitHub.
Guia completo: [LEIA-ME.md](LEIA-ME.md).

### Usar direto no Claude na nuvem (sem instalar nada no computador)

No menu do ambiente (barra de título da sessão) → **Editar**:
1. **Variáveis de ambiente:** `META_ACCESS_TOKEN=<seu token>` e `META_AD_ACCOUNT_ID=act_<número>`
2. **Acesso à rede:** adicione `graph.facebook.com` em *Domínios permitidos* (deixe marcado "Permitir gerenciadores de pacotes")
3. Abra uma **nova sessão** neste repositório e peça: `@traffic-analyst *analisar`
