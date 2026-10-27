// Compara os dados embutidos nas páginas do site com os JSON que o app consome (pc/data/*.json).
// Uso: node tests/compare_data.js   (sai com código 1 se houver divergência)
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const html = (f) => fs.readFileSync(path.join(RAIZ, 'pc', 'html', f), 'utf8');
const json = (f) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'pc', 'data', f), 'utf8'));
const BS = String.fromCharCode(92);
let falhas = 0;
const ok = (cond, msg) => { console.log(`[${cond ? 'OK' : 'FALHA'}] ${msg}`); if (!cond) falhas++; };

// Extrai o literal JS que vem depois de "const NOME =" (objeto ou array)
function extrair(src, nome) {
  const i = src.indexOf('const ' + nome + ' =');
  if (i < 0) return null;
  let j = src.indexOf('=', i) + 1;
  while (/\s/.test(src[j])) j++;
  const abre = src[j], fecha = abre === '{' ? '}' : ']';
  let d = 0, k = j, str = null;
  for (; k < src.length; k++) {
    const c = src[k];
    if (str) { if (c === BS) { k++; continue; } if (c === str) str = null; continue; }
    if (c === '"' || c === "'" || c === '`') { str = c; continue; }
    if (c === abre) d++; else if (c === fecha && --d === 0) break;
  }
  return Function('return ' + src.slice(j, k + 1))();
}

const sim = html('simulados.html');
const BANCO = extrair(sim, 'BANCO');
const CONFIG = extrair(sim, 'CONFIG');
const banco = json('banco-simulado.json');
const config = json('simulado-config.json');

if (BANCO) ok(JSON.stringify(BANCO) === JSON.stringify(banco), 'banco de questões: página Simulados = pc/data/banco-simulado.json');
else console.log('[INFO] simulados.html não tem banco embutido (lê do JSON)');
if (CONFIG) ok(JSON.stringify(CONFIG) === JSON.stringify(config), 'configuração: página Simulados = pc/data/simulado-config.json');
else console.log('[INFO] simulados.html não tem configuração embutida (lê do JSON)');

// Fonte única dos simulados: nenhum número fixo fora de pc/data/simulado-config.json (Lote 2)
const ler = (...p) => fs.readFileSync(path.join(RAIZ, ...p), 'utf8');
ok(!/\d+\s+(minutos|questões)/.test(html('index.html')), 'página inicial: cards sem número fixo de questões/minutos');
ok(!BANCO && !CONFIG && !/\d+ questões &middot;/.test(sim), 'página Simulados: sem banco, configuração ou números embutidos');
const APP_SRC = ['mobile', 'LHubApp', 'LHubApp', 'src'];
ok(!/CONFIG_PADRAO|SIMULADOS_CARDS|questoes:\s*\d/.test(ler(...APP_SRC, 'data.js')), 'app (data.js): sem cópia da configuração');
ok(!/CATEGORIAS_SIMULADO/.test(ler(...APP_SRC, 'theme.js')), 'app (theme.js): sem cópia das categorias');
const CAMPOS = ['questoes', 'tempo', 'categoria', 'nivel', 'nota', 'feitos'];
const faltando = Object.entries(config).flatMap(([m, c]) => CAMPOS.filter((k) => c[k] === undefined).map((k) => `${m}.${k}`));
ok(!faltando.length, `configuração com todos os campos dos cards ${faltando.join(', ')}`);
const semQuestoes = Object.keys(config).filter((m) => !(banco[m] || []).length);
const semConfig = Object.keys(banco).filter((m) => !config[m]);
ok(!semQuestoes.length && !semConfig.length, `matérias da configuração e do banco coincidem ${[...semQuestoes, ...semConfig].join(', ')}`);

console.log('\nQuestões por matéria e nível (banco do app):');
for (const [m, qs] of Object.entries(banco)) {
  const porNivel = {};
  qs.forEach((q) => { porNivel[q.dificuldade] = (porNivel[q.dificuldade] || 0) + 1; });
  const cfg = config[m] || {};
  console.log(`  ${m.padEnd(11)} ${String(qs.length).padStart(2)} questões ${JSON.stringify(porNivel)} | config: ${JSON.stringify(cfg)}`);
}

const problemas = [];
for (const [m, qs] of Object.entries(banco)) qs.forEach((q) => {
  if (!/^[A-E]$/.test(q.gabarito)) problemas.push(`${m}#${q.id} gabarito=${q.gabarito}`);
  ['altA', 'altB', 'altC', 'altD', 'altE'].forEach((a) => { if (!q[a]) problemas.push(`${m}#${q.id} ${a} vazia`); });
});
const ids = Object.values(banco).flat().map((q) => q.id);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
ok(!problemas.length, `questões com gabarito e 5 alternativas ${problemas.length ? problemas.slice(0, 5).join('; ') : ''}`);
ok(!dup.length, `ids de questão únicos ${dup.join(',')}`);

const red = html('redacao.html');
const TEMAS = extrair(red, 'TEMAS');
const CART = extrair(red, 'CARTILHAS');
const rj = json('redacao.json');
if (TEMAS) ok(JSON.stringify(TEMAS) === JSON.stringify(rj.temas), 'temas de redação: página = pc/data/redacao.json');
if (CART) ok(JSON.stringify(CART) === JSON.stringify(rj.cartilhas), 'cartilhas: página = pc/data/redacao.json');

console.log(`\n${falhas ? falhas + ' divergência(s)' : 'sem divergências'}`);
process.exit(falhas ? 1 : 0);
