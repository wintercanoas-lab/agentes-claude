#!/usr/bin/env node
/**
 * Aplicar alteracoes — Time de Trafego Pago
 *
 * UNICO caminho para alterar a conta de anuncios. Sem a confirmacao, so mostra
 * o plano (antes -> depois) e nao muda nada.
 *
 * Uso:
 *   node scripts/aplicar.js pausar    <id>
 *   node scripts/aplicar.js ativar    <id>
 *   node scripts/aplicar.js orcamento <id> <reais_por_dia>
 *
 * Para aplicar de verdade (somente depois do "sim" do usuario):
 *   META_WRITE_CONFIRMED=1 node scripts/aplicar.js ...
 */

const MetaAdsClient = require('../lib/meta-ads-client');

async function main() {
  const [acao, id, valor] = process.argv.slice(2);
  const acoes = ['pausar', 'ativar', 'orcamento'];
  if (!acoes.includes(acao) || !id || (acao === 'orcamento' && !(Number(valor) > 0))) {
    console.log('Uso: node scripts/aplicar.js pausar|ativar <id>  |  orcamento <id> <reais_por_dia>');
    process.exit(1);
  }

  const client = new MetaAdsClient();
  const atual = await client._get(`/${id}`, { fields: 'name,status,daily_budget' });
  if (!atual.success) {
    console.log('Erro ao ler o item:', atual.error.message);
    process.exit(1);
  }
  const { name, status, daily_budget } = atual.data;
  const reais = (c) => (c ? `R$ ${(Number(c) / 100).toFixed(2)}/dia` : 'sem orcamento diario');

  console.log('PLANO');
  console.log(`  Item:   ${name} (${id})`);
  if (acao === 'pausar') console.log(`  Status: ${status} -> PAUSED`);
  if (acao === 'ativar') console.log(`  Status: ${status} -> ACTIVE  (passa a gastar dinheiro)`);
  if (acao === 'orcamento') console.log(`  Orcamento: ${reais(daily_budget)} -> ${reais(Math.round(Number(valor) * 100))}`);

  if (process.env.META_WRITE_CONFIRMED !== '1') {
    console.log('\nNada foi alterado. Mostre este plano ao usuario e so aplique depois do "sim" dele.');
    return;
  }

  const resultado =
    acao === 'pausar' ? await client.pause(id)
    : acao === 'ativar' ? await client.activate(id)
    : await client.updateDailyBudget(id, Math.round(Number(valor) * 100));

  console.log(resultado.success ? '\nAPLICADO com sucesso.' : `\nFALHOU: ${resultado.error.message}`);
  if (!resultado.success) process.exit(1);
}

main().catch((err) => {
  console.error('Erro inesperado:', err.message);
  process.exit(1);
});
