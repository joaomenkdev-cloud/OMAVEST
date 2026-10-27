// ============================================================
//  OMAVEST — Criar conta
//  Modo padrão: cadastro local (API .NET).  Com js/firebase-config.js preenchido
//  usa Firebase (Google + 2FA TOTP) como na versão original.
// ============================================================
import { carregarFirebase } from './firebase-loader.js';
import { Local, guardarUsuarioNaSessao } from './auth-local.js';

const FB = await carregarFirebase();           // null => modo local
const $  = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let currentUser = null, totpSession = null, totpSecret = null;
let registrando = false;      // evita redirecionar antes de terminar o cadastro e o 2FA

const loading = show => $('loadingOverlay').classList.toggle('show', show);
function showAlert(id, msg, type = 'error') {
    const el = $(id);
    el.className = 'auth-alert ' + type;
    el.innerHTML = `<i class="fa-solid fa-${type === 'error' ? 'circle-xmark' : 'circle-check'}"></i> ${esc(msg)}`;
}

if (!FB) $('googleBlock')?.classList.add('hidden-local');

// ── Já está logado? vai direto para a área do candidato ──
if (FB) {
    FB.A.onAuthStateChanged(FB.auth, user => { if (user && !registrando) window.location.href = 'area-candidato.html'; });
} else {
    Local.sessaoAtual().then(u => { if (u) window.location.href = 'area-candidato.html'; });
}

// ── Mostrar/ocultar senha ────────────────────────────────
window.togglePw = function (inputId, iconId) {
    const inp = $(inputId), ico = $(iconId);
    const oculto = inp.type === 'password';
    inp.type = oculto ? 'text' : 'password';
    ico.className = oculto ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
};

// ── Força da senha ───────────────────────────────────────
$('senha').addEventListener('input', function () {
    const v = this.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const labels = ['', 'Fraca', 'Média', 'Boa', 'Forte'];
    const classes = ['', 'weak', 'medium', 'good', 'strong'];
    ['s1', 's2', 's3', 's4'].forEach((id, i) => { $(id).className = i < score ? classes[score] : ''; });
    $('strengthLabel').textContent = labels[score] ? `Senha ${labels[score]}` : '';
    $('strengthLabel').style.color = score <= 1 ? '#ef4444' : score <= 2 ? '#f97316' : score <= 3 ? '#eab308' : '#22c55e';
});

// ── OTP (2FA Firebase) ───────────────────────────────────
document.querySelectorAll('#otpInputs input').forEach((inp, i, all) => {
    inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/\D/g, '');
        if (inp.value && i < all.length - 1) all[i + 1].focus();
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && i > 0) all[i - 1].focus(); });
});

async function salvarUsuarioFirestore(user, extra = {}) {
    await FB.F.setDoc(FB.F.doc(FB.db, 'usuarios', user.uid), {
        uid: user.uid, email: user.email, nome: user.displayName || extra.nome || '',
        fotoUrl: user.photoURL || '', provider: extra.provider || 'email', twoFAAtivo: false,
        criadoEm: FB.F.serverTimestamp(), ultimoLogin: FB.F.serverTimestamp(), ...extra,
    }, { merge: true });
}

function mostrarSucesso() {
    $('registerScreen').style.display = 'none';
    $('twoFAScreen').style.display = 'none';
    $('successScreen').style.display = 'block';
}

// ── Cadastro ─────────────────────────────────────────────
$('regForm').addEventListener('submit', async e => {
    e.preventDefault();
    const nome   = $('nome').value.trim();
    const sob    = $('sobrenome').value.trim();
    const email  = $('email').value.trim();
    const senha  = $('senha').value;
    const conf   = $('confirmar').value;
    const termos = $('termos').checked;

    let ok = true;
    const err = (id, show) => { $(id).style.display = show ? 'block' : 'none'; if (show) ok = false; };
    err('erNome', !nome);
    err('erSobrenome', !sob);
    err('erEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    err('erSenha', senha.length < 8);
    err('erConfirmar', senha !== conf);
    err('erTermos', !termos);
    if (!ok) return;

    registrando = true;
    loading(true);
    $('regAlert').className = 'auth-alert';
    try {
        if (FB) {
            const cred = await FB.A.createUserWithEmailAndPassword(FB.auth, email, senha);
            currentUser = cred.user;
            await FB.A.updateProfile(currentUser, { displayName: `${nome} ${sob}` });
            await salvarUsuarioFirestore(currentUser, { nome: `${nome} ${sob}`, provider: 'email' });
            loading(false);
            mostrar2FASetup();
        } else {
            currentUser = await Local.registrar(`${nome} ${sob}`, email, senha);
            loading(false);
            mostrarSucesso();
        }
    } catch (error) {
        loading(false);
        const msgs = {
            'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
            'auth/invalid-email': 'E-mail inválido.',
            'auth/weak-password': 'Senha fraca. Use pelo menos 8 caracteres.',
        };
        showAlert('regAlert', msgs[error.code] || error.message || 'Erro ao criar conta. Tente novamente.');
    }
});

// ── Google (Firebase) ────────────────────────────────────
window.loginGoogle = async function () {
    if (!FB) { showAlert('regAlert', 'Login com Google exige o Firebase configurado.'); return; }
    registrando = true;
    loading(true);
    try {
        const result = await FB.A.signInWithPopup(FB.auth, new FB.A.GoogleAuthProvider());
        currentUser = result.user;
        await salvarUsuarioFirestore(currentUser, { provider: 'google' });
        window.location.href = 'area-candidato.html';
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') showAlert('regAlert', 'Erro ao entrar com Google. Tente novamente.');
    } finally { loading(false); }
};

// ── 2FA (Firebase) ───────────────────────────────────────
async function mostrar2FASetup() {
    $('registerScreen').style.display = 'none';
    $('twoFAScreen').style.display = 'block';
    try {
        const mfaUser = FB.A.multiFactor(currentUser);
        totpSession = await mfaUser.getSession();
        totpSecret = await FB.A.TotpMultiFactorGenerator.generateSecret(totpSession);
        const qrUrl = totpSecret.generateQrCodeUrl(currentUser.email, 'OMAVEST');
        $('totpSecret').textContent = totpSecret.secretKey;
        $('qrCodeContainer').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}" alt="QR Code 2FA" width="160" height="160">`;
    } catch (e) {
        console.warn('2FA setup error:', e);
        window.pular2FA();
    }
}

window.verificar2FA = async function () {
    const code = [...document.querySelectorAll('#otpInputs input')].map(i => i.value).join('');
    if (code.length !== 6) { showAlert('twoFAAlert', 'Digite os 6 dígitos do código.'); return; }
    $('btn2FA').disabled = true;
    $('btn2FA').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
    try {
        const cred = FB.A.TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, code);
        await FB.A.multiFactor(currentUser).enroll(cred, 'Autenticador OMAVEST');
        await FB.F.setDoc(FB.F.doc(FB.db, 'usuarios', currentUser.uid), { twoFAAtivo: true }, { merge: true });
        mostrarSucesso();
    } catch {
        showAlert('twoFAAlert', 'Código inválido ou expirado. Tente novamente.');
        $('btn2FA').disabled = false;
        $('btn2FA').innerHTML = '<i class="fa-solid fa-shield-check"></i> Verificar e ativar 2FA';
    }
};

window.pular2FA = mostrarSucesso;
