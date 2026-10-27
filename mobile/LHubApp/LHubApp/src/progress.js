// Progresso de estudos por usuário (mesma lógica do site): demo vem preenchida, contas novas começam em 0%
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MATERIAS_PROGRESSO = [
  { key: 'Matematica', label: 'Matemática', detalhe: 'Matemática · Física' },
  { key: 'Portugues',  label: 'Português',  detalhe: 'Português · Humanas · Inglês' },
  { key: 'Ciencias',   label: 'Ciências',   detalhe: 'Ciências · Química · Biologia' },
];
const MAPA = {
  matematica: 'Matematica', fisica: 'Matematica',
  portugues: 'Portugues', historia: 'Portugues', geografia: 'Portugues', ingles: 'Portugues',
  quimica: 'Ciencias', biologia: 'Ciencias', ciencias: 'Ciencias',
};
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const chave = (u) => '@omavest:progress:' + (u ? (u.numero_inscricao || u.email || 'user') : 'visitante');
export const ehDemo = (u) => !!u && (u.numero_inscricao === 'OM-DEMO' || u.email === 'demo@omavest.com');

const listeners = new Set();
export const onProgresso = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };
const avisar = () => listeners.forEach((cb) => { try { cb(); } catch (_) {} });

function seedDemo() {
  const dia = (n) => new Date(Date.now() - n * 86400000).toISOString();
  return {
    valores: { Matematica: 72, Portugues: 64, Ciencias: 85 },
    historico: [
      { materia: 'Biologia', acertos: 34, total: 40, data: dia(1) },
      { materia: 'Matemática', acertos: 31, total: 45, data: dia(3) },
      { materia: 'História', acertos: 19, total: 30, data: dia(5) },
      { materia: 'Química', acertos: 27, total: 35, data: dia(8) },
    ],
  };
}

export async function getProgresso(user) {
  try {
    const raw = await AsyncStorage.getItem(chave(user));
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  if (!user) return { valores: { Matematica: 72, Portugues: 64, Ciencias: 85 }, historico: [], exemplo: true };
  const p = ehDemo(user) ? seedDemo() : { valores: { Matematica: 0, Portugues: 0, Ciencias: 0 }, historico: [] };
  try { await AsyncStorage.setItem(chave(user), JSON.stringify(p)); } catch (_) {}
  return p;
}

export async function registrarSimulado(user, { materia, acertos, total }) {
  if (!materia || !total) return null;
  let p = await getProgresso(user);
  if (p.exemplo) p = { valores: { Matematica: 0, Portugues: 0, Ciencias: 0 }, historico: [] };
  const pct = Math.round((acertos / total) * 100);
  const k = MAPA[semAcento(materia)];
  if (k) {
    const atual = p.valores[k] || 0;
    p.valores[k] = atual === 0 ? pct : Math.min(100, Math.round(atual * 0.7 + pct * 0.3));
  }
  p.historico = [{ materia, acertos, total, data: new Date().toISOString() }, ...(p.historico || [])].slice(0, 10);
  try { await AsyncStorage.setItem(chave(user), JSON.stringify(p)); } catch (_) {}
  avisar();
  return p;
}

export async function resetProgresso(user) {
  try { await AsyncStorage.removeItem(chave(user)); } catch (_) {}
  avisar();
}
