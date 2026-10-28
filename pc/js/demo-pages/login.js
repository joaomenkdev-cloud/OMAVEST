(async function(){
  const { login, register, toggleTheme, refreshThemeControls, getUser } = window.OMAVEST;
  const status=document.querySelector('#loginStatus');
  const title=document.querySelector('#authTitle');
  const subtitle=document.querySelector('#authSubtitle');
  const nameField=document.querySelector('#nameField');
  const submit=document.querySelector('#authSubmit');
  const form=document.querySelector('#authForm');
  let mode='login';

  const existing=await getUser();
  if(existing){ location.replace('index.html'); return; }

  function setMode(next){
    mode=next==='register'?'register':'login';
    document.querySelectorAll('[data-auth-mode]').forEach(btn=>{const on=btn.dataset.authMode===mode;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',on?'true':'false');});
    nameField.classList.toggle('hidden',mode!=='register');
    title.textContent=mode==='login'?'Bem-vindo de volta':'Crie sua conta local';
    subtitle.textContent=mode==='login'?'Entre para continuar seus estudos no protótipo OMAVEST.':'Seu perfil e progresso ficam salvos neste navegador.';
    submit.textContent=mode==='login'?'Entrar':'Criar conta e entrar';
    document.querySelector('#loginPassword').autocomplete=mode==='login'?'current-password':'new-password';
    status.textContent='';
  }

  document.querySelectorAll('[data-auth-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.authMode)));
  document.querySelector('#demoFillBtn').addEventListener('click',()=>{
    setMode('login');
    document.querySelector('#loginEmail').value='demo@omavest.com';
    document.querySelector('#loginPassword').value='123456';
    status.textContent='Conta de demonstração preenchida. Clique em Entrar.';
  });
  const EYE='<path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
  const EYE_OFF='<path d="M3 3l18 18"/><path d="M10.6 5.2A9.8 9.8 0 0 1 12 5c6.2 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.3 6.4C3.7 8.1 2 12 2 12s3.8 7 10 7a9.7 9.7 0 0 0 4-.85"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>';
  document.querySelector('#togglePassword').addEventListener('click',()=>{
    const input=document.querySelector('#loginPassword');
    const btn=document.querySelector('#togglePassword');
    const show=input.type==='password';
    input.type=show?'text':'password';
    btn.querySelector('svg').innerHTML=show?EYE_OFF:EYE;
    btn.querySelector('span').textContent=show?'Ocultar':'Mostrar';
    btn.setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    try{
      status.textContent=mode==='login'?'Entrando...':'Criando sua conta...';
      submit.disabled=true;
      const email=document.querySelector('#loginEmail').value;
      const password=document.querySelector('#loginPassword').value;
      if(mode==='login') await login(email,password);
      else await register(document.querySelector('#loginName').value,email,password);
      status.textContent='Tudo certo. Abrindo seu painel...';
      location.replace('index.html');
    }catch(err){
      status.textContent=err.message;
    }finally{
      submit.disabled=false;
    }
  });
  document.querySelector('[data-theme-toggle]')?.addEventListener('click',()=>toggleTheme());
  refreshThemeControls();
  setMode('login');
})().catch(function(e){ console.error(e); if(window.OMAVEST) window.OMAVEST.toast('Erro no login: '+e.message); });
