#!/usr/bin/env node
/**
 * Check-up da conta — Time de Trafego Pago
 *
 * Verifica (SOMENTE LEITURA) se a conta de anuncios esta pronta para anunciar:
 * status, pagamento, permissoes do token, pagina, Instagram e pixel.
 *
 * Uso: node scripts/checar-conta.js
 */

const TOKEN = process.env.META_ACCESS_TOKEN;
const ACCOUNT = process.env.META_AD_ACCOUNT_ID;
const BASE = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v19.0'}`;

const STATUS = {
  1: ['OK', 'Ativa'],
  2: ['PROBLEMA', 'Desativada pela Meta'],
  3: ['PROBLEMA', 'Pagamento pendente (conta com divida)'],
  7: ['ATENCAO', 'Em analise de risco pela Meta'],
  8: ['ATENCAO', 'Aguardando acerto de pagamento'],
  9: ['ATENCAO', 'Periodo de carencia (pagamento atrasado)'],
  100: ['PROBLEMA', 'Fechamento pendente'],
  101: ['PROBLEMA', 'Fechada'],
};
const ICONE = { OK: '✅', ATENCAO: '⚠️', PROBLEMA: '❌', INFO: 'ℹ️' };
const PERMISSOES = ['ads_read', 'ads_management'];

async function get(endpoint, params = {}) {
  const url = new URL(BASE + endpoint);
  url.searchParams.set('access_token', TOKEN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const json = await (await fetch(url)).json();
    return json.error ? { erro: json.error.message } : json;
  } catch (e) {
    return { erro: e.message };
  }
}

const itens = [];
const add = (nivel, assunto, detalhe) => itens.push({ nivel, assunto, detalhe });

async function main() {
  if (!TOKEN || !ACCOUNT) {
    console.log('❌ Credenciais ausentes: configure META_ACCESS_TOKEN e META_AD_ACCOUNT_ID.');
    process.exit(1);
  }
  if (!/^act_\d+$/.test(ACCOUNT)) {
    add('PROBLEMA', 'Formato do ID da conta', `"${ACCOUNT}" deveria ser act_ seguido so de numeros (ex: act_123456).`);
  }

  const camposConta = 'name,account_status,disable_reason,currency,timezone_name,amount_spent,spend_cap,funding_source_details';
  const lerConta = async () => {
    const r = await get(`/${ACCOUNT}`, { fields: `${camposConta},business{name}` });
    // business{name} exige business_management; sem ela, le o resto da conta assim mesmo
    if (r.erro && /business_management/.test(r.erro)) return { ...(await get(`/${ACCOUNT}`, { fields: camposConta })), semPermissaoBusiness: true };
    return r;
  };
  const [perms, conta, pixels, paginas, insta] = await Promise.all([
    get('/me/permissions'),
    lerConta(),
    get(`/${ACCOUNT}/adspixels`, { fields: 'name,last_fired_time,is_unavailable' }),
    get(`/${ACCOUNT}/promote_pages`, { fields: 'name' }),
    get(`/${ACCOUNT}/instagram_accounts`, { fields: 'username' }),
  ]);

  // Permissoes do token
  if (perms.erro) {
    add('PROBLEMA', 'Token', `Nao foi aceito pela Meta: ${perms.erro}`);
  } else {
    const concedidas = (perms.data || []).filter((p) => p.status === 'granted').map((p) => p.permission);
    const faltam = PERMISSOES.filter((p) => !concedidas.includes(p));
    if (faltam.length) add('PROBLEMA', 'Permissoes do token', `Faltam: ${faltam.join(', ')}`);
    else add('OK', 'Permissoes do token', PERMISSOES.join(' + '));
  }

  // Conta de anuncios
  if (conta.erro) {
    add('PROBLEMA', 'Conta de anuncios', `Nao consegui ler ${ACCOUNT}: ${conta.erro}`);
  } else {
    const [nivel, texto] = STATUS[conta.account_status] || ['ATENCAO', `Status desconhecido (${conta.account_status})`];
    const motivo = conta.disable_reason ? ` — motivo do bloqueio: codigo ${conta.disable_reason}` : '';
    add(nivel, 'Status da conta', `${conta.name}: ${texto}${motivo}`);
    add('INFO', 'Moeda e fuso', `${conta.currency} | ${conta.timezone_name}`);
    if (conta.business?.name) add('OK', 'Portfolio empresarial', conta.business.name);
    else if (conta.semPermissaoBusiness) add('INFO', 'Portfolio empresarial', 'Nao verificado: o token nao tem business_management (opcional).');
    else add('ATENCAO', 'Portfolio empresarial', 'Conta nao esta ligada a um portfolio empresarial');

    const pagamento = conta.funding_source_details?.display_string;
    if (pagamento) add('OK', 'Forma de pagamento', pagamento);
    else add('PROBLEMA', 'Forma de pagamento', 'Nenhuma encontrada. Cadastre um cartao/Pix em Gerenciador de Anuncios > Cobranca.');

    const cap = Number(conta.spend_cap || 0);
    const gasto = Number(conta.amount_spent || 0);
    if (cap > 0 && gasto >= cap) add('PROBLEMA', 'Limite de gastos', 'Limite da conta atingido — anuncios nao vao rodar.');
    else if (cap > 0) add('INFO', 'Limite de gastos', `Gasto ${(gasto / 100).toFixed(2)} de ${(cap / 100).toFixed(2)} ${conta.currency}`);
    if (gasto === 0) add('INFO', 'Historico', 'Conta nunca gastou: comece com orcamento baixo e suba aos poucos (aquecimento).');
  }

  // Pagina do Facebook
  if (paginas.erro) add('ATENCAO', 'Pagina do Facebook', `Nao consegui verificar: ${paginas.erro}`);
  else if (paginas.data?.length) add('OK', 'Pagina do Facebook', paginas.data.map((p) => p.name).join(', '));
  else add('PROBLEMA', 'Pagina do Facebook', 'Nenhuma pagina liberada para anunciar nesta conta.');

  // Instagram
  if (insta.erro) add('ATENCAO', 'Instagram', `Nao consegui verificar: ${insta.erro}`);
  else if (insta.data?.length) add('OK', 'Instagram', insta.data.map((i) => '@' + i.username).join(', '));
  else add('ATENCAO', 'Instagram', 'Nenhum Instagram ligado a esta conta. Os anuncios sairiam so com a pagina.');

  // Pixel
  if (pixels.erro) {
    add('ATENCAO', 'Pixel', `Nao consegui verificar: ${pixels.erro}`);
  } else if (!pixels.data?.length) {
    add('ATENCAO', 'Pixel', 'Nenhum pixel. Necessario so para vender/captar no SITE (nao para WhatsApp/mensagens).');
  } else {
    for (const p of pixels.data) {
      const dias = p.last_fired_time ? Math.floor((Date.now() - new Date(p.last_fired_time)) / 86400000) : null;
      if (dias === null) add('ATENCAO', `Pixel "${p.name}"`, 'Nunca disparou — nao esta instalado no site.');
      else if (dias > 7) add('ATENCAO', `Pixel "${p.name}"`, `Ultimo disparo ha ${dias} dias.`);
      else add('OK', `Pixel "${p.name}"`, `Ativo (ultimo disparo ha ${dias} dia(s)).`);
    }
  }

  console.log(`CHECK-UP DA CONTA — ${ACCOUNT}\n`);
  for (const i of itens) console.log(`${ICONE[i.nivel]} ${i.assunto}: ${i.detalhe}`);
  const problemas = itens.filter((i) => i.nivel === 'PROBLEMA').length;
  const atencao = itens.filter((i) => i.nivel === 'ATENCAO').length;
  console.log(`\nRESUMO: ${problemas} problema(s), ${atencao} ponto(s) de atencao.`);
  console.log(problemas ? 'Resolva os problemas antes de anunciar.' : 'Tecnicamente pronta para anunciar.');
}

main().catch((err) => {
  console.error('Erro inesperado:', err.message);
  process.exit(1);
});
