(async function(){
const { mountShell, escapeHtml, toast, apiOr, api, post, put, patch, login, register, logout, isFirebaseConfigured, getUser, resetDemo } = window.OMAVEST;
await mountShell("cronograma.html");
const r=await apiOr('/api/calendario-vestibulares',{data:[]});const el=document.querySelector('#calendarTimeline');el.innerHTML=r.data?.length?r.data.map(x=>{const d=new Date(`${String(x.dataInicio).slice(0,10)}T12:00:00`);return `<article class="timeline-item"><div class="timeline-date">${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}</div><div><h3>${escapeHtml(x.instituicao)} • ${escapeHtml(x.evento)}</h3><p>${escapeHtml(x.tipo||'evento')}</p></div><span class="tag yellow">Verificar edital</span></article>`}).join(''):'<div class="empty-state">Nenhum evento cadastrado.</div>';

})().catch(function(e){ console.error(e); if(window.OMAVEST) window.OMAVEST.toast('Erro na demonstração: '+e.message); });
