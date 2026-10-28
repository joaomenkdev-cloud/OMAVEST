import { getUser } from "./firebase-auth.js";

const items = [
  ["index.html","⌂","Início"],
  ["cronograma.html","▣","Cronograma"],
  ["simulados.html","▦","Simulados"],
  ["provas.html","▧","Provas antigas"],
  ["questoes.html","✓","Questões"],
  ["comunidade.html","◉","Comunidade"],
  ["redacao.html","✎","Redação"],
  ["vestibulares.html","◇","Vestibulares"],
];

const THEME_KEY="omavest_theme_v1";
function getTheme(){
  try{return localStorage.getItem(THEME_KEY)==="light"?"light":"dark"}catch{return "dark"}
}
function applyTheme(theme){
  const next=theme==="light"?"light":"dark";
  document.documentElement.dataset.theme=next;
  try{localStorage.setItem(THEME_KEY,next)}catch{}
  const btn=document.querySelector('[data-theme-toggle]');
  if(btn){btn.textContent=next==="dark"?"☀":"☾";btn.title=next==="dark"?"Ativar modo claro":"Ativar modo escuro";}
}

export async function mountShell(active = "index.html") {
  const sidebar = document.querySelector("#sidebar");
  const topbar = document.querySelector("#topbar");
  if (!sidebar || !topbar) return;

  sidebar.innerHTML = `
    <div class="brand-row"><a href="index.html" class="brand-link"><img src="../assets/logo-omavest-v13.png" alt="OMAVEST"></a></div>
    <nav class="nav-list">${items.map(([href,icon,label]) => `<a class="nav-link ${active===href?'active':''}" href="${href}"><span class="nav-icon">${icon}</span><span>${label}</span></a>`).join("")}</nav>
    <div class="nav-bottom nav-list">
      <a class="donation-nav ${active==='doacoes.html'?'active':''}" href="doacoes.html"><span class="nav-icon">♡</span><span>Apoiar</span></a>
      <a class="nav-link" href="configuracoes.html"><span class="nav-icon">⚙</span><span>Configurações</span></a>
      <a class="nav-link" href="ajuda.html"><span class="nav-icon">?</span><span>Ajuda</span></a>
    </div>`;

  const user = await getUser();
  const name = user?.displayName || user?.email?.split("@")[0] || "Estudante";
  const initial = (name.trim()[0] || "E").toUpperCase();
  topbar.innerHTML = `
    <a class="mobile-brand" href="index.html" aria-label="OMAVEST"><img src="../assets/favicon.png" alt=""></a>
    <div class="topbar-spacer"></div>
    <div class="user-tools"><button class="theme-toggle" data-theme-toggle type="button" aria-label="Alternar tema"></button><a class="user-profile-link" href="perfil.html"><span class="avatar">${initial}</span><span class="user-name">${escapeHtml(name)}</span></a></div>`;

  applyTheme(getTheme());
  document.querySelector('[data-theme-toggle]')?.addEventListener('click',()=>applyTheme(getTheme()==='dark'?'light':'dark'));
}

export function toast(message) {
  const old = document.querySelector(".toast"); old?.remove();
  const el = document.createElement("div"); el.className = "toast"; el.textContent = message; document.body.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}
