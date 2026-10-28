(async function(){
  const { mountShell, toast, logout, resetDemo, setTheme, refreshThemeControls } = window.OMAVEST;
  await mountShell('configuracoes.html');
  document.querySelectorAll('[data-theme-choice]').forEach(btn=>btn.addEventListener('click',()=>{
    setTheme(btn.dataset.themeChoice);
    toast(btn.dataset.themeChoice==='light'?'Modo claro ativado.':'Modo escuro ativado.');
  }));
  refreshThemeControls();
  document.querySelector('#logoutBtn')?.addEventListener('click',async()=>{await logout();location.replace('login.html');});
  document.querySelector('#resetDemoBtn')?.addEventListener('click',()=>{if(confirm('Restaurar a demonstração e apagar o progresso local?')) resetDemo();});
})().catch(function(e){ console.error(e); if(window.OMAVEST) window.OMAVEST.toast('Erro nas configurações: '+e.message); });
