(async function(){
  const {mountShell,recordDonation,getDonations,toast}=window.OMAVEST;
  await mountShell('doacoes.html');
  let selected=10;
  const custom=document.querySelector('#customDonation');
  const buttons=[...document.querySelectorAll('[data-amount]')];
  function choose(value,btn){selected=Number(value);buttons.forEach(b=>b.classList.toggle('selected',b===btn));custom.value='';}
  buttons.forEach(btn=>btn.addEventListener('click',()=>choose(btn.dataset.amount,btn)));
  custom.addEventListener('input',()=>{if(custom.value){selected=Number(custom.value);buttons.forEach(b=>b.classList.remove('selected'))}});
  function render(){const rows=getDonations();document.querySelector('#donationHistory').innerHTML=rows.length?rows.map(d=>`<div class="donation-item"><div><strong>R$ ${Number(d.amount).toFixed(2).replace('.',',')}</strong><br><small>Apoio demonstrativo</small></div><small>${new Date(d.createdAt).toLocaleDateString('pt-BR')}</small></div>`).join(''):'<div class="empty-state">Nenhum apoio demonstrativo registrado.</div>'}
  document.querySelector('#supportBtn').addEventListener('click',()=>{try{const amount=custom.value?Number(custom.value):selected;recordDonation(amount);render();custom.value='';toast('Apoio demonstrativo registrado. Obrigado!')}catch(e){toast(e.message)}});
  render();
})().catch(e=>{console.error(e);window.OMAVEST?.toast('Erro na área de apoio: '+e.message)});
