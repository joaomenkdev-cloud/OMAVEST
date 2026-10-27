// ============================================================
//  OMAVEST — autenticação local (API .NET + SQLite)
//  Funciona sem Firebase e sem internet. Sessão guardada no navegador.
// ============================================================
const API = window.OMAVEST_API || (location.protocol.startsWith('http') ? `${location.origin}/api` : 'http://localhost:5000/api');

const KEY_TOKEN = 'omavest_token';
const KEY_USER  = 'omavest_user';

function lerStorage(k)  { try { return localStorage.getItem(k); } catch { return null; } }
function gravarStorage(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* modo privado */ } }

async function chamar(caminho, { metodo = 'GET', corpo, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = lerStorage(KEY_TOKEN);
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    let resp;
    try {
        resp = await fetch(`${API}${caminho}`, {
            method: metodo, headers,
            body: corpo ? JSON.stringify(corpo) : undefined,
            signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
        });
    } catch {
        throw new Error('Não foi possível conectar ao servidor OMAVEST. Verifique se ele está em execução (INICIAR-OMAVEST.bat).');
    }

    let dados = {};
    try { dados = await resp.json(); } catch { /* resposta sem corpo */ }
    if (!resp.ok || dados.success === false) {
        const e = new Error(dados.message || `Erro ${resp.status}`);
        e.status = resp.status;
        throw e;
    }
    return dados;
}

// A API devolve PascalCase (NumeroInscricao, Nome...). Dentro do site usamos nomes simples.
function normalizar(u) {
    if (!u) return null;
    return {
        nome: u.Nome ?? u.nome,
        email: u.Email ?? u.email,
        numero_inscricao: u.NumeroInscricao ?? u.numero_inscricao,
        criado_em: u.CriadoEm ?? u.criado_em,
    };
}

function salvarSessao(dados) {
    const usuario = normalizar(dados.usuario);
    gravarStorage(KEY_TOKEN, dados.token);
    gravarStorage(KEY_USER, JSON.stringify(usuario));
    return usuario;
}

export const Local = {
    token: () => lerStorage(KEY_TOKEN),

    usuarioSalvo() {
        try { return JSON.parse(lerStorage(KEY_USER) || 'null'); } catch { return null; }
    },

    async login(identificador, senha) {
        const d = await chamar('/auth/login', { metodo: 'POST', corpo: { identificador, senha } });
        return salvarSessao(d);
    },

    async registrar(nome, email, senha) {
        const d = await chamar('/auth/registrar', { metodo: 'POST', corpo: { nome, email, senha } });
        return salvarSessao(d);
    },

    /** Confere o token no servidor. Retorna o usuário ou null (e limpa a sessão se expirou). */
    async sessaoAtual() {
        if (!lerStorage(KEY_TOKEN)) return null;
        try {
            const d = await chamar('/auth/perfil', { auth: true });
            const usuario = normalizar(d.usuario);
            gravarStorage(KEY_USER, JSON.stringify(usuario));
            return usuario;
        } catch (e) {
            if (e.status === 401) this.limparSessao();
            return null;
        }
    },

    async trocarSenha(senhaAtual, senhaNova) {
        return chamar('/auth/trocar-senha', { metodo: 'POST', corpo: { senha_atual: senhaAtual, senha_nova: senhaNova }, auth: true });
    },

    async sair() {
        try { await chamar('/auth/logout', { metodo: 'POST', auth: true }); } catch { /* ignora */ }
        this.limparSessao();
    },

    limparSessao() { gravarStorage(KEY_TOKEN, null); gravarStorage(KEY_USER, null); },

    comunicados: (limite = 3) => chamar(`/noticias/recentes?limite=${limite}`)
        .then(d => (d.data || []).map(n => ({ titulo: n.Titulo ?? n.titulo, publicado_em: n.PublicadoEm ?? n.publicado_em }))),
};

/** Usado pelo Firebase (quando configurado) para o cabeçalho mostrar o nome do usuário. */
export function guardarUsuarioNaSessao(usuario) {
    gravarStorage(KEY_USER, usuario ? JSON.stringify(usuario) : null);
}
