# Time de Tráfego Pago — Meta Ads

Repositório com 6 agentes do Claude Code (`.claude/agents/`) para gerenciar anúncios no Meta Ads (Facebook/Instagram). Responda sempre em português do Brasil.

## 🔒 Trava de segurança (obrigatória)

Nenhuma alteração na conta de anúncios sem o "sim" explícito do usuário: criar, pausar, ativar, apagar, mudar orçamento, público, lance ou criativo.

- Mostre o plano (o que muda, item e ID, antes → depois, impacto no gasto/dia) e pergunte "Posso aplicar?". Pare e espere.
- Aplique só pelo `scripts/aplicar.js` com `META_WRITE_CONFIRMED=1`, e só depois do "sim" para aquele plano.
- Itens novos nascem PAUSADOS.
- Nunca desative ou contorne a trava (`lib/meta-ads-client.js`, `.claude/hooks/trava-meta.js`, `.claude/settings.json`).
- Leituras (análises e relatórios) não precisam de confirmação.

Credenciais: `META_ACCESS_TOKEN` e `META_AD_ACCOUNT_ID` (formato `act_...`), nas variáveis do ambiente na nuvem ou no `.env` local. Nunca exiba nem grave o token.
