// ============================================================
//  OMAVEST — Minha Área
//  Modo padrão: conta local (API .NET).  Se js/firebase-config.js estiver
//  configurado, usa Firebase (Google, 2FA etc.) como na versão original.
// ============================================================
import { carregarFirebase } from './firebase-loader.js';
import { Local, guardarUsuarioNaSessao } from './auth-local.js';

const FB = await carregarFirebase();           // null => modo local
const $  = id => document.getElementById(id);

let currentUser = null;
let mfaResolver = null, modal2FASecret = null, modal2FASession = null;

// ── Helpers de interface ─────────────────────────────────
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loading = show => $('loadingOverlay').classList.toggle('show', show);

function showToast(msg, type = 'info') {
    const t = $('toast');
    const icons = { success: 'circle-check', error: 'circle-xmark', info: 'circle-info' };
    t.className = 'toast show ' + type;
    t.innerHTML = `<i class="fa-solid fa-${icons[type] || 'circle-info'}"></i> ${esc(msg)}`;
    setTimeout(() => t.classList.remove('show'), 3500);
}

function showAlert(id, msg, type = 'error') {
    const el = $(id);
    el.className = 'auth-alert ' + type;
    el.innerHTML = `<i class="fa-solid fa-${type === 'error' ? 'circle-xmark' : 'circle-info'}"></i> ${esc(msg)}`;
}

window.togglePw = function (inputId, iconId) {
    const inp = $(inputId), ico = $(iconId);
    inp.type = inp.type === 'password' ? 'text' : 'password';
    ico.className = inp.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
};

// ── OTP (somente Firebase/2FA) ───────────────────────────
function initOtpInputs(containerId) {
    document.querySelectorAll(`#${containerId} input`).forEach((inp, i, all) => {
        inp.addEventListener('input', () => {
            inp.value = inp.value.replace(/\D/g, '');
            if (inp.value && i < all.length - 1) all[i + 1].focus();
        });
        inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && i > 0) all[i - 1].focus(); });
    });
}
initOtpInputs('otpChallenge');
initOtpInputs('otpModal');
const getOtpValue = id => [...document.querySelectorAll(`#${id} input`)].map(i => i.value).join('');
function clearOtp(id) {
    document.querySelectorAll(`#${id} input`).forEach(i => i.value = '');
    document.querySelector(`#${id} input`)?.focus();
}

// ── Telas ────────────────────────────────────────────────
function mostrarLogin() { $('loginScreen').style.display = 'block'; $('twoFAChallenge').style.display = 'none'; $('resetScreen').style.display = 'none'; }
window.mostrarLogin = mostrarLogin;
window.mostrarReset = function () { $('loginScreen').style.display = 'none'; $('resetScreen').style.display = 'block'; $('twoFAChallenge').style.display = 'none'; };

function abrirDashboard() {
    $('loginArea').style.display = 'none';
    $('dashboardArea').style.display = 'block';
    window.scrollTo({ top: 0 });
}
function abrirLogin() {
    $('dashboardArea').style.display = 'none';
    $('loginArea').style.display = 'block';
    mostrarLogin();
}

// ── Modo local: ajusta a interface ───────────────────────
if (!FB) {
    $('googleBlock')?.classList.add('hidden-local');
    $('twoFARow')?.classList.add('hidden-local');
    $('demoBox')?.classList.remove('hidden-local');
}

// ══════════════════════════════════════════════════════════
//  LOGIN
// ══════════════════════════════════════════════════════════
const traducaoErro = {
    'auth/user-not-found': 'Nenhuma conta com este e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
};

window.fazerLogin = async function () {
    const email = $('loginEmail').value.trim();
    const senha = $('loginSenha').value;
    if (!email || !senha) { showAlert('loginAlert', 'Preencha e-mail e senha.'); return; }

    const btn = $('btnLogin');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
    $('loginAlert').className = 'auth-alert';

    try {
        if (FB) {
            await FB.A.signInWithEmailAndPassword(FB.auth, email, senha);   // onAuthStateChanged cuida do resto
        } else {
            currentUser = await Local.login(email, senha);
            await carregarDashboardLocal(currentUser);
            abrirDashboard();
        }
    } catch (err) {
        if (err.code === 'auth/multi-factor-auth-required') {
            mfaResolver = FB.A.getMultiFactorResolver(FB.auth, err);
            $('loginScreen').style.display = 'none'; $('twoFAChallenge').style.display = 'block'; clearOtp('otpChallenge');
        } else {
            showAlert('loginAlert', traducaoErro[err.code] || err.message || 'Erro ao entrar. Tente novamente.');
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar';
    }
};

// Atalho para a apresentação: preenche e entra com a conta demo
window.entrarDemo = function () {
    $('loginEmail').value = 'demo@omavest.com';
    $('loginSenha').value = '123456';
    window.fazerLogin();
};

$('loginSenha').addEventListener('keydown', e => { if (e.key === 'Enter') window.fazerLogin(); });
$('loginEmail').addEventListener('keydown', e => { if (e.key === 'Enter') window.fazerLogin(); });

// ── Google / 2FA / reset (Firebase) ──────────────────────
window.loginGoogle = async function () {
    if (!FB) { showToast('Login com Google exige o Firebase configurado.', 'info'); return; }
    loading(true);
    try {
        const provider = new FB.A.GoogleAuthProvider();
        const result = await FB.A.signInWithPopup(FB.auth, provider);
        await FB.F.setDoc(FB.F.doc(FB.db, 'usuarios', result.user.uid), {
            uid: result.user.uid, email: result.user.email, nome: result.user.displayName,
            fotoUrl: result.user.photoURL, provider: 'google', ultimoLogin: FB.F.serverTimestamp(),
        }, { merge: true });
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') showAlert('loginAlert', 'Erro ao entrar com Google.');
    } finally { loading(false); }
};

window.verificarDesafio2FA = async function () {
    const code = getOtpValue('otpChallenge');
    if (code.length !== 6) { showAlert('twoFAChallengeAlert', 'Digite os 6 dígitos.'); return; }
    const btn = $('btnVerify2FA');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
    try {
        const assertion = FB.A.TotpMultiFactorGenerator.assertionForSignIn(mfaResolver.hints[0].uid, code);
        await mfaResolver.resolveSignIn(assertion);
    } catch {
        showAlert('twoFAChallengeAlert', 'Código inválido. Tente novamente.');
        clearOtp('otpChallenge');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-shield-check"></i> Verificar';
    }
};

window.enviarReset = async function () {
    const email = $('resetEmail').value.trim();
    if (!email) { showAlert('resetAlert', 'Insira seu e-mail.'); return; }
    if (!FB) {
        showAlert('resetAlert', 'A recuperação por e-mail exige o Firebase configurado. Na demonstração use demo@omavest.com / 123456.', 'info');
        return;
    }
    try {
        await FB.A.sendPasswordResetEmail(FB.auth, email);
        showAlert('resetAlert', 'Link enviado! Verifique sua caixa de entrada.', 'info');
    } catch (e) {
        showAlert('resetAlert', e.code === 'auth/user-not-found' ? 'Nenhuma conta com este e-mail.' : 'Erro ao enviar. Tente novamente.');
    }
};

// ══════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════
function preencherAvatar(nome, fotoUrl) {
    const el = $('dashAvatar');
    if (fotoUrl) el.innerHTML = `<img src="${esc(fotoUrl)}" alt="Avatar" class="avatar">`;
    else el.innerHTML = `<div class="avatar-placeholder">${esc((nome || 'U')[0].toUpperCase())}</div>`;
}

function atualizar2FAStatus(ativo) {
    $('dash2FABadge').textContent = ativo ? '🛡 2FA Ativo' : '⚠ 2FA Inativo';
    $('dash2FABadge').className = 'dash-badge ' + (ativo ? 'badge-2fa-on' : 'badge-2fa-off');
    $('info2FA').textContent = ativo ? 'Ativo' : 'Inativo';
    $('info2FA').className = 'status-chip ' + (ativo ? 'chip-ok' : 'chip-warn');
    $('label2FA').textContent = ativo ? '2FA ativo — sua conta está protegida' : 'Adicione uma camada extra de segurança';
    $('btn2FAToggle').innerHTML = ativo
        ? '<i class="fa-solid fa-shield-xmark"></i> Desativar'
        : '<i class="fa-solid fa-shield-plus"></i> Ativar';
}

const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtData = iso => { const d = new Date(iso); return isNaN(d) ? '' : `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`; };

async function carregarComunicados() {
    const box = $('newsMini');
    try {
        const lista = await Local.comunicados(3);
        if (!lista.length) return;
        box.innerHTML = lista.map(n => `
            <div class="news-mini-item"><div class="news-mini-dot"></div>
              <div><div class="news-mini-title">${esc(n.titulo)}</div>
              <div class="news-mini-date">${esc(fmtData(n.publicado_em))}</div></div></div>`).join('');
    } catch { /* mantém a lista estática */ }
}

async function carregarProva() {
    try {
        const r = await fetch(`${window.OMAVEST_API}/cronograma`);
        const itens = await r.json();
        const fmt = d => d ? d.split('-').reverse().join('/') : null;
        const nome = i => i.Titulo ?? i.titulo;
        const prova = itens.find(i => nome(i) === 'Prova');
        const locais = itens.find(i => nome(i) === 'Divulgação dos Locais');
        if (prova) $('examDateLabel').textContent = fmt(prova.data_inicio);
        if (locais) $('localDate').textContent = fmt(locais.data_inicio);
    } catch { /* usa o texto padrão */ }
}

async function carregarDashboardLocal(u) {
    preencherAvatar(u.nome, null);
    $('dashNome').textContent = u.nome;
    $('dashEmail').textContent = u.email;
    $('infoNome').textContent = u.nome;
    $('infoEmail').textContent = u.email;
    $('infoData').textContent = u.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-BR') : '—';
    $('infoProvider').textContent = 'Conta OMAVEST';
    $('infoInscricao').textContent = u.numero_inscricao || '—';
    atualizar2FAStatus(false);
    $('info2FA').textContent = 'Indisponível (modo local)';
    iniciarCountdownDash();
    carregarComunicados();
    carregarProva();
    renderProgresso();
    document.title = `Minha Área — ${u.nome.split(' ')[0]} · OMAVEST`;
}

async function carregarDashboardFirebase(user) {
    preencherAvatar(user.displayName || user.email, user.photoURL);
    $('dashNome').textContent = user.displayName || user.email;
    $('dashEmail').textContent = user.email;
    $('infoNome').textContent = user.displayName || '—';
    $('infoEmail').textContent = user.email;
    $('infoInscricao').textContent = '—';
    $('infoProvider').textContent = (user.providerData[0]?.providerId || 'email') === 'google.com' ? 'Google' : 'E-mail / Senha';
    try {
        const snap = await FB.F.getDoc(FB.F.doc(FB.db, 'usuarios', user.uid));
        if (snap.exists()) {
            const data = snap.data();
            $('infoData').textContent = (data.criadoEm?.toDate?.() || new Date()).toLocaleDateString('pt-BR');
            atualizar2FAStatus(data.twoFAAtivo || false);
        }
    } catch {
        $('infoData').textContent = new Date().toLocaleDateString('pt-BR');
        atualizar2FAStatus(false);
    }
    iniciarCountdownDash();
    carregarComunicados();
    carregarProva();
    renderProgresso();
}

// ── Progresso de estudos (barras + histórico de simulados) ──
const NOMES = [['Matematica', 'Matemática · Física'], ['Portugues', 'Português · Humanas · Inglês'], ['Ciencias', 'Ciências · Química · Biologia']];
function renderProgresso() {
    if (!window.OMAVEST_getProgresso) return;
    const p = window.OMAVEST_getProgresso();
    $('progBars').innerHTML = NOMES.map(([k, nome]) => `
        <div class="prog-row"><div class="prog-label"><span>${nome}</span><span>${p.valores[k] || 0}%</span></div>
        <div class="prog-track"><div class="prog-fill" data-w="${p.valores[k] || 0}"></div></div></div>`).join('');
    requestAnimationFrame(() => setTimeout(() => document.querySelectorAll('#progBars .prog-fill').forEach(f => { f.style.width = f.dataset.w + '%'; }), 50));
    const hist = p.historico || [];
    $('progHist').innerHTML = hist.length ? hist.slice(0, 5).map(h => {
        const pct = Math.round((h.acertos / h.total) * 100);
        const cls = pct >= 70 ? 'hist-ok' : pct >= 50 ? 'hist-mid' : 'hist-low';
        return `<div class="hist-item"><div><strong>${esc(h.materia)}</strong><div style="font-size:.74rem;color:#6E7A74">${esc(fmtData(h.data))} · ${h.acertos}/${h.total} acertos</div></div><span class="hist-nota ${cls}">${pct}%</span></div>`;
    }).join('') : '<div style="font-size:.85rem;color:#6E7A74">Você ainda não fez simulados. Faça o primeiro e veja o progresso subir!</div>';
    const u = Local.usuarioSalvo();
    $('btnResetProgresso').style.display = (u && (u.numero_inscricao === 'OM-DEMO' || u.email === 'demo@omavest.com')) ? 'inline' : 'none';
}
window.addEventListener('omavest:progresso-atualizado', renderProgresso);
$('btnResetProgresso').addEventListener('click', e => { e.preventDefault(); window.OMAVEST_resetProgresso(); showToast('Demonstração reiniciada.', 'info'); });

// ── Inicialização da sessão ──────────────────────────────
if (FB) {
    FB.A.onAuthStateChanged(FB.auth, async user => {
        if (user) {
            currentUser = user;
            guardarUsuarioNaSessao({ nome: user.displayName || user.email, email: user.email });
            await carregarDashboardFirebase(user);
            abrirDashboard();
        } else { guardarUsuarioNaSessao(null); }
    });
} else {
    Local.sessaoAtual().then(async u => {
        if (!u) return;
        currentUser = u;
        await carregarDashboardLocal(u);
        abrirDashboard();
    });
}

// ══════════════════════════════════════════════════════════
//  SEGURANÇA
// ══════════════════════════════════════════════════════════
window.trocarSenha = async function () {
    const atual = $('senhaAtual')?.value || '';
    const nova  = $('senhaNova').value;
    const conf  = $('senhaConf').value;
    if (!FB && !atual) { showToast('Informe a senha atual.', 'error'); return; }
    if (!nova || nova.length < 8) { showToast('Mínimo 8 caracteres.', 'error'); return; }
    if (nova !== conf) { showToast('As senhas não coincidem.', 'error'); return; }
    try {
        if (FB) await FB.A.updatePassword(currentUser, nova);
        else await Local.trocarSenha(atual, nova);
        showToast('Senha alterada com sucesso!', 'success');
        ['senhaAtual', 'senhaNova', 'senhaConf'].forEach(id => { if ($(id)) $(id).value = ''; });
    } catch (e) {
        if (e.code === 'auth/requires-recent-login') showToast('Por segurança, saia e entre novamente antes de trocar a senha.', 'error');
        else showToast(e.message || 'Erro ao alterar senha.', 'error');
    }
};

window.gerenciar2FA = async function () {
    if (!FB) { showToast('A verificação em 2 etapas exige o Firebase configurado.', 'info'); return; }
    const snap = await FB.F.getDoc(FB.F.doc(FB.db, 'usuarios', currentUser.uid));
    if (snap.exists() && snap.data().twoFAAtivo) {
        if (!confirm('Deseja desativar a verificação em 2 etapas?')) return;
        try {
            const mfaUser = FB.A.multiFactor(currentUser);
            for (const factor of mfaUser.enrolledFactors) await mfaUser.unenroll(factor);
            await FB.F.setDoc(FB.F.doc(FB.db, 'usuarios', currentUser.uid), { twoFAAtivo: false }, { merge: true });
            atualizar2FAStatus(false);
            showToast('2FA desativado.', 'info');
        } catch { showToast('Erro ao desativar 2FA. Tente novamente.', 'error'); }
        return;
    }
    abrirModal2FA();
};

async function abrirModal2FA() {
    $('modal2FA').style.display = 'flex';
    $('modal2FAqr').innerHTML = '<div style="width:160px;height:160px;background:#E6F0EB;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#9ca3af"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';
    $('modal2FAkey').textContent = 'Gerando...';
    clearOtp('otpModal');
    try {
        const mfaUser = FB.A.multiFactor(currentUser);
        modal2FASession = await mfaUser.getSession();
        modal2FASecret = await FB.A.TotpMultiFactorGenerator.generateSecret(modal2FASession);
        const qrUrl = modal2FASecret.generateQrCodeUrl(currentUser.email, 'OMAVEST');
        $('modal2FAqr').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}" width="160" height="160" style="border-radius:12px;border:3px solid white;box-shadow:0 4px 20px rgba(0,0,0,.12)">`;
        $('modal2FAkey').textContent = modal2FASecret.secretKey;
    } catch (e) {
        console.warn('2FA modal error:', e);
        window.fecharModal2FA();
        showToast('Erro ao gerar QR Code. Tente novamente.', 'error');
    }
}
window.fecharModal2FA = function () { $('modal2FA').style.display = 'none'; };

window.confirmarModal2FA = async function () {
    const code = getOtpValue('otpModal');
    if (code.length !== 6) { showAlert('modal2FAAlert', 'Digite os 6 dígitos do código.'); return; }
    try {
        const cred = FB.A.TotpMultiFactorGenerator.assertionForEnrollment(modal2FASecret, code);
        await FB.A.multiFactor(currentUser).enroll(cred, 'Autenticador OMAVEST');
        await FB.F.setDoc(FB.F.doc(FB.db, 'usuarios', currentUser.uid), { twoFAAtivo: true }, { merge: true });
        window.fecharModal2FA();
        atualizar2FAStatus(true);
        showToast('2FA ativado com sucesso! Conta protegida.', 'success');
    } catch {
        showAlert('modal2FAAlert', 'Código inválido ou expirado. Tente novamente.');
        clearOtp('otpModal');
    }
};

// ── Logout ───────────────────────────────────────────────
window.fazerLogout = async function () {
    if (FB) await FB.A.signOut(FB.auth); else await Local.sair();
    currentUser = null;
    $('loginSenha').value = '';
    abrirLogin();
    showToast('Você saiu da sua conta.', 'info');
};

// ── Contagem regressiva ──────────────────────────────────
let cdTimer = null;
async function iniciarCountdownDash() {
    const alvo = await (window.OMAVEST_getExamDate ? window.OMAVEST_getExamDate() : Promise.resolve(new Date('2027-02-14T09:00:00').getTime()));
    const pad = v => String(v).padStart(2, '0');
    function atualizar() {
        const diff = Math.max(0, alvo - Date.now());
        $('cdDias').textContent = pad(Math.floor(diff / 86400000));
        $('cdHoras').textContent = pad(Math.floor((diff % 86400000) / 3600000));
        $('cdMin').textContent = pad(Math.floor((diff % 3600000) / 60000));
        $('cdSeg').textContent = pad(Math.floor((diff % 60000) / 1000));
    }
    clearInterval(cdTimer);
    atualizar();
    cdTimer = setInterval(atualizar, 1000);
}
