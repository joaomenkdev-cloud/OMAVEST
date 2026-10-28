(async function(){
  const { mountShell, getAccount, updateAccount, logout, toast }=window.OMAVEST;
  await mountShell('');

  function paint(data){
    const p=data.profile||{};
    document.querySelector('#profileName').value=data.name||'';
    document.querySelector('#profileEmail').value=data.email||'';
    document.querySelector('#profileExam').value=p.vestibularAlvo||'ENEM';
    document.querySelector('#profileDate').value=p.dataVestibular?String(p.dataVestibular).slice(0,10):'';
    document.querySelector('#profileMinutes').value=p.minutosPorDia||120;
    document.querySelector('#profileDisplayName').textContent=data.name||'Estudante';
    document.querySelector('#profileDisplayEmail').textContent=data.email||'';
    document.querySelector('#profileAvatar').textContent=((data.name||'E').trim()[0]||'E').toUpperCase();
    document.querySelector('#profileTargetSummary').textContent=p.vestibularAlvo||'ENEM';
    document.querySelector('#profileMinutesSummary').textContent=(p.minutosPorDia||120)+' min';
  }

  paint(await getAccount());

  document.querySelector('#accountForm').addEventListener('submit',async e=>{
    e.preventDefault();
    try{
      const updated=await updateAccount({
        nome:document.querySelector('#profileName').value,
        email:document.querySelector('#profileEmail').value,
        vestibularAlvo:document.querySelector('#profileExam').value,
        dataVestibular:document.querySelector('#profileDate').value||null,
        minutosPorDia:Number(document.querySelector('#profileMinutes').value||120)
      });
      paint(updated);
      toast('Perfil atualizado.');
      setTimeout(()=>location.reload(),550);
    }catch(err){ toast(err.message); }
  });

  document.querySelector('#profileLogoutBtn').addEventListener('click',async()=>{
    await logout();
    location.replace('login.html');
  });
})().catch(function(e){ console.error(e); if(window.OMAVEST) window.OMAVEST.toast('Erro no perfil: '+e.message); });
