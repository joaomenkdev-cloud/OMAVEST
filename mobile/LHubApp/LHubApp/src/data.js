// Conteúdo estático do site (banco de simulados, temas de redação), servido pelo próprio servidor em /data/*.json
import client from './api/client';
import { fetchWithCache } from './storage/cache';

const base = () => String(client.defaults.baseURL || '').replace(/\/api\/?$/, '');

export const getBanco = () => fetchWithCache('banco', () => client.get(`${base()}/data/banco-simulado.json`));
export const getRedacao = () => fetchWithCache('redacao', () => client.get(`${base()}/data/redacao.json`));
// Configuração única dos simulados (a mesma do site): limite de questões, tempo e dados dos cards
export const getConfigSimulado = () => fetchWithCache('config_simulado', () => client.get(`${base()}/data/simulado-config.json`));

// Configuração + banco de questões: { config, banco }
export async function carregarSimulados() {
  const [config, banco] = await Promise.all([getConfigSimulado(), getBanco()]);
  return { config: config.data ?? {}, banco: banco.data ?? {} };
}

// Questões da matéria no nível escolhido ('misto' = todos os níveis)
export const disponiveis = (dados, materia, nivel) => {
  const todas = dados.banco[materia] || [];
  return nivel && nivel !== 'misto' ? todas.filter((q) => q.dificuldade === nivel) : todas;
};

// Tamanho do simulado: o limite da configuração, sem repetir questões (mesma regra do site)
export const quantidade = (dados, materia, nivel) => {
  const cfg = dados.config[materia];
  return cfg ? Math.min(cfg.questoes, disponiveis(dados, materia, nivel).length) : 0;
};

export const rotuloQuestoes = (n) => `${n} ${n === 1 ? 'questão' : 'questões'}`;

// Ícone de cada matéria no app (o site usa os ícones do Font Awesome)
export const ICONES_MATERIA = {
  'Matemática': 'calculator-outline', 'Português': 'text-outline', 'Física': 'planet-outline', 'Química': 'flask-outline',
  'Biologia': 'leaf-outline', 'História': 'business-outline', 'Geografia': 'earth-outline', 'Inglês': 'language-outline',
};

export const nivelCor = (n) => (n === 'Fácil' ? '#2E9E6B' : n === 'Médio' ? '#DCA60A' : '#D64545');
