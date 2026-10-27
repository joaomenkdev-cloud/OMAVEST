
// ========================================
// OMAVEST — JAVASCRIPT GLOBAL DO SITE
// ========================================
// Quando o site é aberto pelo servidor (http://localhost:5000 ou http://IP-DO-PC:5000) a API
// está na mesma origem. Se a página for aberta direto do disco (file://), cai no localhost.
const API_BASE = location.protocol.startsWith('http') ? `${location.origin}/api` : 'http://localhost:5000/api';
window.OMAVEST_API = API_BASE;

// Data da prova (usada na contagem regressiva). O valor real vem do cronograma da API.
const EXAM_FALLBACK = '2027-02-14T09:00:00';
let examDateMs = new Date(EXAM_FALLBACK).getTime();
const examDateReady = fetch(`${API_BASE}/cronograma`, { signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined })
    .then(r => r.ok ? r.json() : [])
    .then(list => {
        const prova = (Array.isArray(list) ? list : []).find(c => (c.Titulo ?? c.titulo) === 'Prova');
        if (prova && prova.data_inicio) examDateMs = new Date(prova.data_inicio + 'T09:00:00').getTime();
    })
    .catch(() => {});
window.OMAVEST_getExamDate = () => examDateReady.then(() => examDateMs);

document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initHeader();
    initCountdown();
    initMobileMenu();
    initScrollAnimations();
    initSmoothScroll();
    initStepCards();
    initSimuladoButtons();
    initFilterSimulados();
    initRipple();
    initNavActive();
    initPageTransitions();
    initAuthState();       // ← detecta login e atualiza UI
    initStudyProgress();   // ← progresso de estudos funcional
    initA11y();            // ← acessibilidade: ícones decorativos, menu, link ativo
});

const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ========================================
// 1. CUSTOM CURSOR
// ========================================
function initCursor() {
    if (REDUCED_MOTION) return;
    if (window.innerWidth <= 768 || !window.matchMedia('(pointer: fine)').matches) return;
    const dot   = document.getElementById('cursor');
    const ring  = document.getElementById('cursor-ring');
    if (!dot || !ring) return;
    document.body.classList.add('custom-cursor');

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX; mouseY = e.clientY;
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
    });

    // Ring follows with lag
    function animateRing() {
        ringX += (mouseX - ringX) * 0.14;
        ringY += (mouseY - ringY) * 0.14;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover effect on interactive elements
    const hoverEls = 'a, button, .step-card, .simulado-card, .news-card, .filter-btn, .countdown-item';
    document.querySelectorAll(hoverEls).forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // Click feedback
    document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
    document.addEventListener('mouseup',   () => document.body.classList.remove('cursor-click'));

    document.addEventListener('mouseleave', () => { dot.style.opacity='0'; ring.style.opacity='0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity='1'; ring.style.opacity='0.5'; });
}

// ========================================
// 2. HEADER SCROLL
// ========================================
function initHeader() {
    const header = document.querySelector('header');
    if (!header) return;
    const onScroll = () => {
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

// ========================================
// 3. COUNTDOWN
// ========================================
function initCountdown() {
    const els = {
        days: document.getElementById('days'),
        hours: document.getElementById('hours'),
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds'),
    };
    if (!els.days) return;

    let prev = {};
    let timer;
    function update() {
        const diff = examDateMs - Date.now();
        if (diff <= 0) { clearInterval(timer); return; }
        const vals = {
            days:    Math.floor(diff / 86400000),
            hours:   Math.floor((diff % 86400000) / 3600000),
            minutes: Math.floor((diff % 3600000)  / 60000),
            seconds: Math.floor((diff % 60000)    / 1000),
        };
        Object.entries(vals).forEach(([k, v]) => {
            const s = String(v).padStart(2, '0');
            if (prev[k] !== s && els[k]) {
                els[k].style.transform = 'translateY(-8px)';
                els[k].style.opacity   = '0';
                setTimeout(() => {
                    els[k].textContent   = s;
                    els[k].style.transform = 'translateY(0)';
                    els[k].style.opacity   = '1';
                }, 150);
                prev[k] = s;
            }
        });
    }
    Object.values(els).forEach(el => { if (el) el.style.transition = 'all 0.15s ease'; });
    timer = setInterval(update, 1000);
    update();
}

// ========================================
// 4. MENU MOBILE
// ========================================
function initMobileMenu() {
    const btn  = document.getElementById('menuBtn');
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('menuIcon');
    if (!btn || !menu) return;

    const setOpen = (open) => {
        menu.classList.toggle('show', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        if (icon) icon.innerHTML = open
            ? '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'
            : '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
    };
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('show')) { setOpen(false); btn.focus(); } });
    document.addEventListener('click', e => { if (menu.classList.contains('show') && !menu.contains(e.target) && !btn.contains(e.target)) setOpen(false); });
    btn.addEventListener('click', () => {
        const open = menu.classList.toggle('show');
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        if (icon) icon.innerHTML = open
            ? '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'
            : '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        menu.classList.remove('show');
        if (icon) icon.innerHTML = '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
    }));
}

// ========================================
// 5. SCROLL ANIMATIONS — stagger
// ========================================
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('animate-in');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    // Stagger children inside sections
    document.querySelectorAll('.steps-grid, .simulados-grid, .news-list, .footer-grid').forEach(container => {
        Array.from(container.children).forEach((child, i) => {
            child.classList.add('animate-on-scroll');
            child.style.transitionDelay = `${i * 0.08}s`;
            observer.observe(child);
        });
    });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ========================================
// 6. SMOOTH SCROLL
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const href = a.getAttribute('href');
            if (href === '#' || href.length < 2) return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        });
    });
}

// ========================================
// 7. STEP CARDS
// ========================================
function initStepCards() {
    document.querySelectorAll('.step-card').forEach(card => {
        card.addEventListener('click', () => {
            card.style.transform = 'scale(0.97) translateY(-4px)';
            setTimeout(() => card.style.transform = '', 200);
        });
    });
}

// ========================================
// 8. SIMULADO BUTTONS
// ========================================
function initSimuladoButtons() {
    document.querySelectorAll('.simulado-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const card    = btn.closest('.simulado-card');
            const materia = card?.querySelector('.simulado-title')?.textContent.trim();
            const orig    = btn.innerHTML;

            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Carregando...';
            btn.style.opacity = '0.85';

            setTimeout(() => {
                btn.innerHTML = orig;
                btn.style.opacity = '';
                const param = encodeURIComponent(materia || '');
                window.location.href = `simulados.html?materia=${param}`;
            }, 700);
        });
    });
}

// ========================================
// 9. FILTER SIMULADOS
// ========================================
function initFilterSimulados() {
    const btns  = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.simulado-card');
    if (!btns.length || !cards.length) return;

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-category');
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            cards.forEach((card, i) => {
                const match = cat === 'Todas' || card.getAttribute('data-category') === cat;
                if (match) {
                    card.style.display = 'block';
                    setTimeout(() => card.classList.add('show'), 30 + i * 40);
                } else {
                    card.classList.remove('show');
                    setTimeout(() => card.style.display = 'none', 300);
                }
            });
        });
    });
}

// ========================================
// 10. RIPPLE EFFECT
// ========================================
function initRipple() {
    document.querySelectorAll('.btn, .simulado-btn, .filter-btn').forEach(el => {
        el.classList.add('ripple-container');
        el.addEventListener('click', e => {
            const rect = el.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const size = Math.max(rect.width, rect.height) * 2;
            ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
            el.appendChild(ripple);
            setTimeout(() => ripple.remove(), 700);
        });
    });
}

// ========================================
// 11. NAV ACTIVE LINK
// ========================================
function initNavActive() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
        if (a.getAttribute('href') === page) a.classList.add('active');
    });
}

// ========================================
// 12. PAGE TRANSITIONS
// ========================================
function initPageTransitions() {
    if (REDUCED_MOTION) return;
    const overlay = document.createElement('div');
    overlay.id = 'page-transition';
    overlay.style.cssText = `
        position:fixed;inset:0;z-index:99997;
        background:linear-gradient(135deg,#0B1210,#14241E);
        pointer-events:none;opacity:0;transition:opacity 0.35s ease;
    `;
    document.body.appendChild(overlay);

    // Fade in on load
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 0.4s ease';
        document.body.style.opacity = '1';
    });

    // Ao voltar pelo navegador a página pode vir do cache já com o overlay aberto
    window.addEventListener('pageshow', e => { if (e.persisted) { overlay.style.opacity = '0'; document.body.style.opacity = '1'; } });

    document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('http')) return;
        // Skip links inside download/action areas
        if (a.closest('.prova-actions, .btn-download')) return;
        if (a.target === '_blank') return;
        a.addEventListener('click', e => {
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            overlay.style.opacity = '0.7';
            setTimeout(() => window.location.href = href, 320);
        });
    });
}

// ========================================
// UTILITIES
// ========================================
function formatCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
function getDaysUntil(d) { return Math.floor((new Date(d) - new Date()) / 86400000); }

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.OMAVEST = { formatCPF, getDaysUntil };
}
// ========================================
// 13. AUTH STATE — nome no header + toast
// ========================================
function initAuthState() {
    const userRaw = readSavedUser();
    if (!userRaw) return;

    let user;
    try { user = JSON.parse(userRaw); } catch { return; }

    const firstName = (user.nome || '').split(' ')[0];
    if (!firstName) return;

    // Atualiza o botão "Minha Área" com o primeiro nome
    const label = document.getElementById('navUserLabel');
    if (label) label.textContent = firstName;
    const mobileLabel = document.getElementById('mobileNavUserLabel');
    if (mobileLabel) mobileLabel.textContent = firstName;

    // Mostra toast apenas uma vez por sessão por usuário
    const toastKey = 'omavest_welcomed_' + (user.numero_inscricao || user.email || 'demo');
    if (sessionStorage.getItem(toastKey)) return;
    sessionStorage.setItem(toastKey, '1');

    showWelcomeToast(firstName);
}

function showWelcomeToast(firstName) {
    const toast = document.getElementById('welcome-toast');
    if (!toast) return;

    const title = document.getElementById('toast-title');
    const msg   = document.getElementById('toast-msg');
    const close = document.getElementById('toast-close');
    const bar   = document.getElementById('toast-bar');

    if (title) title.textContent = 'Ola, ' + firstName + '! Bem-vindo!';
    if (msg)   msg.textContent   = 'Voce entrou com sucesso. Bons estudos!';

    // Reinicia a animacao da barra de progresso
    if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = 'toastProgress 4s linear forwards'; }

    setTimeout(() => {
        toast.classList.add('show');
        toast.classList.remove('hide');
    }, 600);

    let autoClose = setTimeout(() => dismissToast(toast), 4600);

    if (close) {
        close.addEventListener('click', () => {
            clearTimeout(autoClose);
            dismissToast(toast);
        });
    }
}

function dismissToast(toast) {
    toast.classList.add('hide');
    toast.classList.remove('show');
}

// ========================================
// 14. PROGRESSO DE ESTUDOS FUNCIONAL
// ========================================
function initStudyProgress() {
    const bars   = document.querySelectorAll('.hcard-progress .hcard-bar-fill');
    const labels = document.querySelectorAll('.hcard-progress .hcard-bar-label span:last-child');
    if (!bars.length) return;

    const render = () => {
        const p = window.OMAVEST_getProgresso();
        STUDY_SUBJECTS.forEach((s, i) => {
            const val = p.valores[s.key] || 0;
            setTimeout(() => {
                if (bars[i]) bars[i].style.width = val + '%';
                if (labels[i]) labels[i].textContent = val + '%';
            }, 300 + i * 150);
        });
        renderHeroDemo();
    };
    window.addEventListener('omavest:progresso-atualizado', render);
    render();
}

// ========================================
// PROGRESSO DE ESTUDOS — por usuário, com conta de demonstração
// ========================================
const STUDY_SUBJECTS = [
    { key: 'Matematica', label: 'Matemática' },
    { key: 'Portugues',  label: 'Português'  },
    { key: 'Ciencias',   label: 'Ciências'   },
];
const STUDY_MAP = {
    'matematica': 'Matematica', 'fisica': 'Matematica',
    'portugues': 'Portugues', 'historia': 'Portugues', 'geografia': 'Portugues', 'ingles': 'Portugues',
    'quimica': 'Ciencias', 'biologia': 'Ciencias', 'ciencias': 'Ciencias',
};
const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function currentUserObj() { try { return JSON.parse(readSavedUser() || 'null'); } catch { return null; } }
function isDemoUser(u) { return !!u && (u.numero_inscricao === 'OM-DEMO' || u.email === 'demo@omavest.com'); }
function progressKey(u) { return 'omavest_progress_' + (u ? (u.numero_inscricao || u.email || 'user') : 'visitante'); }

function demoSeed() {
    const dia = n => new Date(Date.now() - n * 86400000).toISOString();
    return {
        valores: { Matematica: 72, Portugues: 64, Ciencias: 85 },
        historico: [
            { materia: 'Biologia',   acertos: 34, total: 40, data: dia(1) },
            { materia: 'Matemática', acertos: 31, total: 45, data: dia(3) },
            { materia: 'História',   acertos: 19, total: 30, data: dia(5) },
            { materia: 'Química',    acertos: 27, total: 35, data: dia(8) },
        ],
    };
}

window.OMAVEST_getProgresso = function () {
    const u = currentUserObj();
    let p = loadProgress(progressKey(u), true);
    if (!p || !p.valores) {
        if (isDemoUser(u)) p = demoSeed();
        else if (!u) p = { valores: { Matematica: 72, Portugues: 64, Ciencias: 85 }, historico: [], exemplo: true }; // visitante: valores de exemplo
        else p = { valores: { Matematica: 0, Portugues: 0, Ciencias: 0 }, historico: [] };
        if (!p.exemplo) saveProgress(progressKey(u), p, true);
    }
    return p;
};

window.OMAVEST_registrarSimulado = function ({ materia, acertos, total }) {
    if (!materia || !total) return null;
    const u = currentUserObj();
    const p = window.OMAVEST_getProgresso();
    const base = p.exemplo ? { valores: { Matematica: 0, Portugues: 0, Ciencias: 0 }, historico: [] } : p;
    const pct = Math.round((acertos / total) * 100);
    const key = STUDY_MAP[semAcento(materia)];
    if (key) {
        const atual = base.valores[key] || 0;
        base.valores[key] = atual === 0 ? pct : Math.min(100, Math.round(atual * 0.7 + pct * 0.3));
    }
    base.historico = [{ materia, acertos, total, data: new Date().toISOString() }, ...(base.historico || [])].slice(0, 10);
    saveProgress(progressKey(u), base, true);
    window.dispatchEvent(new Event('omavest:progresso-atualizado'));
    OMAVEST_toast(u ? 'Progresso de estudos atualizado!' : 'Entre na sua conta para salvar o progresso.');
    return base;
};

window.OMAVEST_resetProgresso = function () {
    const u = currentUserObj();
    try { localStorage.removeItem(progressKey(u)); } catch {}
    window.dispatchEvent(new Event('omavest:progresso-atualizado'));
};

// Entrar na conta de demonstração sem digitar nada (usado na apresentação)
window.OMAVEST_entrarDemo = async function () {
    const r = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: 'demo@omavest.com', senha: '123456' }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.token) throw new Error(d.message || 'Servidor OMAVEST não respondeu.');
    const u = d.usuario || {};
    try {
        localStorage.setItem('omavest_token', d.token);
        localStorage.setItem('omavest_user', JSON.stringify({ nome: u.Nome, email: u.Email, numero_inscricao: u.NumeroInscricao, criado_em: u.CriadoEm }));
    } catch {}
    return u;
};

window.OMAVEST_sairDemo = function () {
    let t = null;
    try { t = localStorage.getItem('omavest_token'); } catch {}
    if (t) fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } }).catch(() => {});
    try { localStorage.removeItem('omavest_token'); localStorage.removeItem('omavest_user'); } catch {}
    location.reload();
};

function OMAVEST_toast(msg) {
    let t = document.getElementById('omavest-toast');
    if (!t) {
        t = document.createElement('div'); t.id = 'omavest-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
        t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(20px);background:#0F1B17;color:#fff;border:1px solid #F7BD16;padding:.8rem 1.3rem;border-radius:999px;font-size:.9rem;font-weight:600;z-index:100000;opacity:0;transition:all .3s;box-shadow:0 10px 30px rgba(0,0,0,.35)';
        document.body.appendChild(t);
    }
    t.textContent = '📈 ' + msg;
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
    clearTimeout(t._h);
    t._h = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; }, 3200);
}

// Botão do card "Progresso de Estudos" na página inicial (entrar na demo / fazer simulado)
function renderHeroDemo() {
    const box = document.getElementById('hcardDemo');
    if (!box) return;
    const sub = document.getElementById('hcardSub');
    const u = currentUserObj();
    const btn = 'display:inline-flex;align-items:center;gap:.45rem;border:0;cursor:pointer;font:inherit;font-weight:700;font-size:.8rem;padding:.6rem 1.15rem;border-radius:999px;background:#F7BD16;color:#0F1B17;text-decoration:none;box-shadow:0 8px 22px rgba(247,189,22,.35);';
    if (!u) {
        if (sub) sub.textContent = 'Valores de exemplo';
        box.innerHTML = `<button id="btnDemoHero" style="${btn}"><i class="fa-solid fa-bolt"></i> Entrar na conta demo</button>`;
        document.getElementById('btnDemoHero').addEventListener('click', async e => {
            const b = e.currentTarget; b.disabled = true; b.textContent = 'Entrando...';
            try { await OMAVEST_entrarDemo(); location.reload(); }
            catch (err) { b.disabled = false; b.innerHTML = '<i class="fa-solid fa-bolt"></i> Entrar na conta demo'; alert(err.message); }
        });
    } else {
        const nome = (u.nome || '').split(' ')[0] || 'candidato';
        if (sub) sub.textContent = 'Olá, ' + nome + ' · seu progresso';
        box.innerHTML = `<a href="simulados.html" style="${btn}"><i class="fa-solid fa-play"></i> Fazer simulado</a>`;
    }
}

function loadProgress(key, persist) {
    try { const st = persist ? localStorage : sessionStorage; const r = st.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveProgress(key, data, persist) {
    try { (persist ? localStorage : sessionStorage).setItem(key, JSON.stringify(data)); } catch {}
}

// Usuário logado (gravado por js/auth-local.js ou pelo Firebase)
function readSavedUser() {
    try { return localStorage.getItem('omavest_user'); } catch { return null; }
}


// ========================================
// ACESSIBILIDADE
// ========================================
function initA11y() {
    // Ícones do Font Awesome são decorativos: o texto ao lado já descreve a ação
    document.querySelectorAll('i.fa-solid, i.fa-regular, i.fa-brands').forEach(i => i.setAttribute('aria-hidden', 'true'));
    // Página atual no menu
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-menu a, .footer-links a').forEach(a => {
        if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
    });
    // Comunicados dinâmicos e contagem anunciados com educação
    const toast = document.getElementById('welcome-toast');
    if (toast) { toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite'); }
}
