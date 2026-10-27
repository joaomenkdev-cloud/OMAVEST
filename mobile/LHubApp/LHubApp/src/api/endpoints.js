import client from './client';

// ── AUTH ──────────────────────────────────────────────────────
// identificador = e-mail OU número de inscrição
export const apiLogin = (identificador, senha) =>
  client.post('/auth/login', { Identificador: identificador, Senha: senha });

export const apiLogout = () =>
  client.post('/auth/logout');

export const apiTrocarSenha = (senhaAtual, senhaNova) =>
  client.post('/auth/trocar-senha', { senha_atual: senhaAtual, senha_nova: senhaNova });

export const apiPerfil = () =>
  client.get('/auth/perfil');

// ── CANDIDATO ─────────────────────────────────────────────────
export const apiDashboard = () =>
  client.get('/candidato/dashboard');

// ── NOTÍCIAS ──────────────────────────────────────────────────
export const apiNoticias = (pagina = 1, categoria = '') =>
  client.get('/noticias', { params: { pagina, limite: 15, categoria: categoria || undefined } });

export const apiNoticiasDestaques = () =>
  client.get('/noticias/destaques');

export const apiNoticiaDetalhe = (id) =>
  client.get(`/noticias/${id}`);

// ── CRONOGRAMA ────────────────────────────────────────────────
export const apiCronograma = () =>
  client.get('/cronograma');

// ── QUESTÕES / SIMULADO ───────────────────────────────────────
export const apiQuestoes = (materia = '', dificuldade = '', limit = 10) =>
  client.get('/questoes', { params: { materia: materia || undefined, dificuldade: dificuldade || undefined, limit } });

export const apiMaterias = () =>
  client.get('/questoes/materias');

// ── PROVAS ────────────────────────────────────────────────────
export const apiProvas = (ano, area) =>
  client.get('/provas', { params: { ano, area } });

export const apiProvaDownload = (id) =>
  client.post(`/provas/${id}/download`);
