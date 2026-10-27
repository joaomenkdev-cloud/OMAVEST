// ============================================================
//  Carrega o Firebase SOMENTE se js/firebase-config.js existir e estiver
//  preenchido com as credenciais reais. Caso contrário retorna null e o site
//  usa a autenticação local (API .NET) — sem nenhuma configuração.
// ============================================================
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

export async function carregarFirebase() {
    try {
        const cfg = await import('./firebase-config.js');
        const opcoes = cfg.auth?.app?.options || {};
        if (!opcoes.apiKey || /SUA_|YOUR_|XXXX/i.test(opcoes.apiKey)) return null;

        const [A, F] = await Promise.all([
            import(`${SDK}/firebase-auth.js`),
            import(`${SDK}/firebase-firestore.js`),
        ]);
        return { auth: cfg.auth, db: cfg.db, A, F };
    } catch {
        return null;
    }
}
