#!/usr/bin/env node
/**
 * Trava de segurança — Meta Ads
 *
 * Hook PreToolUse do Claude Code. Antes de qualquer comando que possa ALTERAR
 * algo na conta de anúncios (criar, pausar, ativar, mudar orçamento, apagar),
 * força o Claude Code a pedir aprovação ao usuário — mesmo em modo automático.
 * Leituras (relatórios, análises) passam direto.
 */

const fs = require('fs');
const path = require('path');

const ESCRITA = [
  /META_WRITE_CONFIRMED/,                                   // destrava do lib/meta-ads-client.js
  /\b(_post|pause|activate|updateDailyBudget)\s*\(/,       // métodos de escrita do cliente
];
const META = /graph\.facebook\.com|meta-ads-client|META_ACCESS_TOKEN/;
const METODO_ESCRITA = /(-X\s*(POST|DELETE)|--request\s+(POST|DELETE)|\s-d\s|--data|-F\s|--form|method\s*:\s*['"`](POST|DELETE)|\.post\s*\(|\.delete\s*\(|axios\s*\(\s*\{)/i;

function ehEscrita(texto) {
  if (!texto) return false;
  if (ESCRITA.some((r) => r.test(texto))) return true;
  return META.test(texto) && METODO_ESCRITA.test(texto);
}

// Lê também os arquivos .js/.mjs/.cjs que o comando executa (ex.: node meu-script.mjs)
function arquivosExecutados(comando, cwd) {
  const achados = comando.match(/[^\s'"`;|&]+\.(m?js|cjs)\b/g) || [];
  // scripts/aplicar.js já é protegido pelo lib (exige META_WRITE_CONFIRMED=1 no comando)
  return achados.filter((f) => !/scripts\/aplicar\.js$/.test(f)).map((f) => {
    const p = path.isAbsolute(f) ? f : path.join(cwd || process.cwd(), f);
    try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
  });
}

let entrada = '';
process.stdin.on('data', (c) => (entrada += c));
process.stdin.on('end', () => {
  let dados;
  try { dados = JSON.parse(entrada); } catch { process.exit(0); }
  const comando = dados?.tool_input?.command || '';
  const textos = [comando, ...arquivosExecutados(comando, dados?.cwd)];

  if (textos.some(ehEscrita)) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason:
          '🔒 TRAVA DE SEGURANÇA META ADS: este comando pode ALTERAR sua conta de anúncios ' +
          '(criar, pausar, ativar ou mudar orçamento). Só aprove se você já viu e concordou com o plano.',
      },
    }));
  }
  process.exit(0);
});
