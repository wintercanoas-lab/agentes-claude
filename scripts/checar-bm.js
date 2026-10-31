#!/usr/bin/env node
/**
 * Diagnostico de BM + WhatsApp (API oficial) — Time de Trafego Pago
 *
 * SOMENTE LEITURA. Mostra verificacao do negocio, quem tem acesso, contas do
 * WhatsApp, numeros (qualidade, limite de mensagens, status do nome) e templates.
 *
 * Uso: node scripts/checar-bm.js [ID_DA_BM]
 *      (sem argumento, usa META_BUSINESS_ID ou o portfolio da conta META_AD_ACCOUNT_ID)
 */

const TOKEN = process.env.META_ACCESS_TOKEN;
const BASE = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v19.0'}`;

const ICONE = { OK: '✅', ATENCAO: '⚠️', PROBLEMA: '❌', INFO: 'ℹ️' };
const LIMITE = {
  TIER_50: '50/dia', TIER_250: '250/dia', TIER_1K: '1 mil/dia', TIER_10K: '10 mil/dia',
  TIER_100K: '100 mil/dia', TIER_UNLIMITED: 'ilimitado',
};
const QUALIDADE = { GREEN: ['OK', 'Alta'], YELLOW: ['ATENCAO', 'Media'], RED: ['PROBLEMA', 'Baixa'] };

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

async function descobrirBM() {
  if (process.argv[2]) return process.argv[2];
  if (process.env.META_BUSINESS_ID) return process.env.META_BUSINESS_ID;
  if (!process.env.META_AD_ACCOUNT_ID) return null;
  const conta = await get(`/${process.env.META_AD_ACCOUNT_ID}`, { fields: 'business{id}' });
  return conta.business?.id || null;
}

async function main() {
  if (!TOKEN) {
    console.log('❌ Credencial ausente: configure META_ACCESS_TOKEN.');
    process.exit(1);
  }
  const bm = await descobrirBM();
  if (!bm) {
    console.log('❌ Nao sei qual BM checar. Passe o ID: node scripts/checar-bm.js <ID_DA_BM>');
    process.exit(1);
  }

  const [negocio, sistema, perms, wabas, wabasCliente] = await Promise.all([
    get(`/${bm}`, { fields: 'name,verification_status' }),
    get(`/${bm}/system_users`, { fields: 'name,role' }),
    get('/me/permissions'),
    get(`/${bm}/owned_whatsapp_business_accounts`, { fields: 'name,account_review_status' }),
    get(`/${bm}/client_whatsapp_business_accounts`, { fields: 'name,account_review_status' }),
  ]);

  // Negocio
  if (negocio.erro) {
    add('PROBLEMA', 'BM', `Nao consegui ler a BM ${bm}: ${negocio.erro}`);
  } else {
    const v = negocio.verification_status;
    const nivel = v === 'verified' ? 'OK' : v === 'pending_submission' || v === 'not_verified' ? 'PROBLEMA' : 'ATENCAO';
    add(nivel, 'Verificacao do negocio', `${negocio.name}: ${v || 'desconhecido'}`);
  }

  // Token
  if (!perms.erro) {
    const ok = (perms.data || []).filter((p) => p.status === 'granted').map((p) => p.permission);
    if (!ok.includes('whatsapp_business_management')) {
      add('ATENCAO', 'Permissao WhatsApp', 'O token nao tem whatsapp_business_management: nao da para ler numeros e templates.');
    }
  }

  // Usuarios do sistema
  if (!sistema.erro) {
    const lista = (sistema.data || []).map((u) => `${u.name} (${u.role})`).join(', ');
    add('INFO', 'Usuarios do sistema', lista || 'nenhum');
  }

  // Contas e numeros do WhatsApp
  const todas = [...(wabas.data || []), ...(wabasCliente.data || [])];
  if (wabas.erro && wabasCliente.erro) add('ATENCAO', 'Contas do WhatsApp', `Nao consegui ler: ${wabas.erro}`);
  else if (!todas.length) add('ATENCAO', 'Contas do WhatsApp', 'Nenhuma conta do WhatsApp nesta BM.');

  for (const w of todas) {
    const revisao = w.account_review_status;
    add(revisao === 'APPROVED' ? 'OK' : 'ATENCAO', `Conta WhatsApp "${w.name}"`, `revisao: ${revisao || '?'} (ID ${w.id})`);

    const [nums, tpls] = await Promise.all([
      get(`/${w.id}/phone_numbers`, {
        fields: 'display_phone_number,verified_name,quality_rating,messaging_limit_tier,status,name_status,code_verification_status',
      }),
      get(`/${w.id}/message_templates`, { fields: 'status', limit: '200' }),
    ]);

    if (nums.erro) add('ATENCAO', '  Numeros', `Nao consegui ler: ${nums.erro}`);
    for (const n of nums.data || []) {
      const [nivel, qual] = QUALIDADE[n.quality_rating] || ['ATENCAO', n.quality_rating || '?'];
      add(nivel, `  ${n.display_phone_number}`, [
        `nome "${n.verified_name}" (${n.name_status || '?'})`,
        `status ${n.status || '?'}`,
        `qualidade ${qual}`,
        `limite ${LIMITE[n.messaging_limit_tier] || n.messaging_limit_tier || '?'}`,
      ].join(' | '));
    }

    if (!tpls.erro) {
      const cont = {};
      for (const t of tpls.data || []) cont[t.status] = (cont[t.status] || 0) + 1;
      const resumo = Object.entries(cont).map(([s, q]) => `${q} ${s}`).join(', ');
      add(cont.REJECTED ? 'ATENCAO' : 'INFO', '  Templates', resumo || 'nenhum');
    }
  }

  console.log(`DIAGNOSTICO DA BM — ${bm}\n`);
  for (const i of itens) console.log(`${ICONE[i.nivel]} ${i.assunto}: ${i.detalhe}`);
  const problemas = itens.filter((i) => i.nivel === 'PROBLEMA').length;
  const atencao = itens.filter((i) => i.nivel === 'ATENCAO').length;
  console.log(`\nRESUMO: ${problemas} problema(s), ${atencao} ponto(s) de atencao.`);
}

main().catch((err) => {
  console.error('Erro inesperado:', err.message);
  process.exit(1);
});
