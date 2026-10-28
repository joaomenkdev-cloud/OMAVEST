(async function(){
const { mountShell, escapeHtml, apiOr } = window.OMAVEST;
await mountShell("index.html");

const fallback = {
  estatisticas:{diasParaVestibular:128,diasSequencia:0,questoesResolvidas:0,mediaAcertos:0},
  cronograma:[
    {dia:"Seg",disciplina:"Matemática",horaInicio:"18:00",minutosPlanejados:60},
    {dia:"Ter",disciplina:"Português",horaInicio:"18:00",minutosPlanejados:60},
    {dia:"Qua",disciplina:"Biologia",horaInicio:"18:00",minutosPlanejados:60},
    {dia:"Qui",disciplina:"Física",horaInicio:"18:00",minutosPlanejados:60},
    {dia:"Sex",disciplina:"Redação",horaInicio:"18:00",minutosPlanejados:90}
  ],
  proximos:[
    {instituicao:"FUVEST",evento:"Simulado OMAVEST",dataInicio:new Date(Date.now()+17*864e5).toISOString()},
    {instituicao:"UNESP",evento:"Simulado OMAVEST",dataInicio:new Date(Date.now()+25*864e5).toISOString()},
    {instituicao:"UNICAMP",evento:"Simulado OMAVEST",dataInicio:new Date(Date.now()+32*864e5).toISOString()}
  ]
};
const response = await apiOr("/api/dashboard", {success:true,...fallback});
const s = response.estatisticas || fallback.estatisticas;
document.querySelector("#statDays").textContent = s.diasParaVestibular ?? 0;
document.querySelector("#statStreak").textContent = s.diasSequencia ?? 0;
document.querySelector("#statQuestions").textContent = Number(s.questoesResolvidas||0).toLocaleString("pt-BR");
document.querySelector("#statAccuracy").textContent = `${s.mediaAcertos ?? 0}%`;

const schedule=(response.cronograma?.length ? response.cronograma : fallback.cronograma);
document.querySelector("#weekSchedule").innerHTML = schedule.map(x=>`
  <a class="schedule-item schedule-simple" href="cronograma.html"><div class="schedule-day">${escapeHtml(x.dia||'')}</div><div><div class="schedule-title">${escapeHtml(x.disciplina)}</div><div class="schedule-sub">${escapeHtml(x.horaInicio||'18:00')} • ${Number(x.minutosPlanejados||60)} min</div></div><div class="chev">›</div></a>`).join("");

document.querySelector("#upcomingEvents").innerHTML = (response.proximos?.length ? response.proximos : fallback.proximos).map((x,i)=>{
  const d = new Date(`${String(x.dataInicio).slice(0,10)}T12:00:00`); const day = String(d.getDate()).padStart(2,"0"); const mon = d.toLocaleDateString("pt-BR",{month:"short"}).replace(".","").toUpperCase(); const dow=d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","").toUpperCase();
  return `<div class="event-card"><div class="date-box"><small>${dow}</small><strong>${day}</strong><small>${mon}</small></div><div><div class="event-title">Simulado ${escapeHtml(x.instituicao)}</div><div class="event-sub">${escapeHtml(x.evento||"Prática completa")}</div></div><span class="tag ${i===1?'green':'yellow'}">${i===1?'Disponível':'Em breve'}</span></div>`;
}).join("");
})().catch(function(e){ console.error(e); if(window.OMAVEST) window.OMAVEST.toast('Erro na demonstração: '+e.message); });
