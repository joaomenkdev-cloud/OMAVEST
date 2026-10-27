// Procura os VALORES de mobile/.env em todos os arquivos do projeto, sem imprimi-los.
// Uso: node tests/scan_segredos.js [caminho/do/.env]
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const envFile = path.resolve(process.argv[2] || path.join(RAIZ, 'mobile', '.env'));
if (!fs.existsSync(envFile)) {
  console.log(`[OK] ${path.relative(RAIZ, envFile)} não existe - nada a procurar.`);
  process.exit(0);
}
const vals = {};
for (const linha of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  const v = m[2].replace(/^["']|["']$/g, '');
  if (v.length >= 8) vals[m[1]] = v;          // ignora valores curtos/genéricos (ex.: PORT, 7d)
}
const ref = (vals.SUPABASE_URL || '').match(/^https?:\/\/([a-z0-9]+)\./);
if (ref) vals.SUPABASE_PROJECT_REF = ref[1];
const agulhas = Object.entries(vals).map(([k, v]) => [k, Buffer.from(v)]);
console.log('procurando:', Object.keys(vals).map((k) => `${k} (${vals[k].length} caracteres)`).join(', '));

const achados = [];
let arquivos = 0;
(function andar(d) {
  let ents;
  try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== '.git') andar(p); continue; }
    if (!e.isFile() || path.resolve(p) === envFile) continue;
    let b;
    try { if (fs.statSync(p).size > 200 * 1024 * 1024) continue; b = fs.readFileSync(p); } catch { continue; }
    arquivos++;
    for (const [k, n] of agulhas) if (b.indexOf(n) !== -1) achados.push(`${k} -> ${path.relative(RAIZ, p)}`);
  }
})(RAIZ);

console.log(`arquivos verificados: ${arquivos}`);
if (achados.length) { console.log('[FALHA] valores encontrados em:\n  ' + achados.join('\n  ')); process.exit(1); }
console.log('[OK] nenhum valor do .env aparece em outro arquivo');
