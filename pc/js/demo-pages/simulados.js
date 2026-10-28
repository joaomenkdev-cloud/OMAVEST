(async function(){
const {mountShell,escapeHtml,toast,apiOr,post,setExamHandoff,getExamHandoff,icon}=window.OMAVEST;
await mountShell('simulados.html');
const models=await apiOr('/api/simulados/modelos',{data:[]});
const grid=document.querySelector('#modelGrid');
const resumeBox=document.querySelector('#resumeExam');

grid.innerHTML=models.data.length?models.data.map(m=>`<article class="card sim-model-card">
  <div>
    <span class="tag yellow">${escapeHtml(m.instituicao)}</span>
    <h3>${escapeHtml(m.titulo)}</h3>
    <p>${escapeHtml(m.descricao)}</p>
    <div class="sim-model-meta">
      <span>${icon('timer','icon-sm')} ${Math.floor(m.duracaoMinutos/60)}h${m.duracaoMinutos%60?String(m.duracaoMinutos%60).padStart(2,'0'):''}</span>
      <span>${icon('bookOpen','icon-sm')} ${m.quantidadeQuestoes} no formato de referência</span>
      ${m.temRedacao?`<span>${icon('pen','icon-sm')} redação</span>`:''}
    </div>
    <p class="tiny">No modo offline são sorteadas até ${m.limiteLocal||12} questões autorais disponíveis.</p>
  </div>
  <div class="sim-model-actions">
    <select data-time-mode="${m.id}" aria-label="Tempo do simulado">
      <option value="demo">10 min demo</option>
      <option value="official">Tempo de referência</option>
    </select>
    <button class="primary-btn" data-start-model="${m.id}">Começar</button>
  </div>
</article>`).join(''):'<div class="empty-state">Nenhum modelo disponível.</div>';

const handoff=getExamHandoff();
if(handoff?.questions?.length){
  const meta=handoff.meta||{};
  resumeBox.innerHTML=`<article class="card notice-card resume-card"><div><strong>Simulado em andamento</strong><p>Você tem um simulado salvo de <b>${escapeHtml(meta.modelo||meta.vestibular||'OMAVEST')}</b>. O progresso continua de onde parou.</p></div><a class="primary-btn" href="simulado-prova.html">Continuar simulado</a></article>`;
}

let starting=false;
async function begin(payload,seconds){
  if(starting)return;
  starting=true;
  try{
    const r=await post('/api/simulados',payload);
    const questions=r.data||[];
    if(!questions.length)throw new Error('O banco local não possui questões para esse modelo.');
    setExamHandoff({attemptId:r.tentativaId,questions,meta:r.meta,totalSeconds:seconds,answers:{},redacao:''});
    location.href='simulado-prova.html';
  }catch(e){
    starting=false;
    toast(e.message);
  }
}

grid.querySelectorAll('[data-start-model]').forEach(btn=>btn.onclick=()=>{
  const m=models.data.find(x=>x.id===btn.dataset.startModel);
  if(!m)return;
  const mode=grid.querySelector(`[data-time-mode="${m.id}"]`)?.value||'demo';
  const mins=mode==='official'?m.duracaoMinutos:10;
  begin({modeloId:m.id,duracaoMinutos:mins,limiteDemo:m.limiteLocal||12},mins*60);
});

document.querySelector('#simForm').onsubmit=e=>{
  e.preventDefault();
  const mins=+document.querySelector('#customTime').value;
  const includeEssay=document.querySelector('#customEssay').value==='true';
  begin({
    vestibular:document.querySelector('#simVest').value,
    materias:document.querySelector('#simSubjects').value.split(',').map(x=>x.trim()).filter(Boolean),
    quantidade:+document.querySelector('#simCount').value,
    duracaoMinutos:mins,
    limiteDemo:25,
    temRedacao:includeEssay,
    temaRedacao:includeEssay?'Tema livre para treino dissertativo-argumentativo':''
  },mins*60);
};

function formatDuration(seconds){
  seconds=Number(seconds)||0;
  const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60);
  if(h)return `${h}h ${String(m).padStart(2,'0')}min`;
  return `${m||0} min`;
}
async function loadHistory(){
  const r=await apiOr('/api/simulados/historico',{data:[]});
  const rows=r.data||[];
  const total=rows.length;
  const avg=rows.length?Math.round(rows.reduce((a,x)=>a+(Number(x.percentual)||0),0)/rows.length):0;
  const essays=rows.filter(x=>x.redacaoNota!=null).length;
  document.querySelector('#simHistorySummary').innerHTML=`<article class="stat-card"><div><div class="stat-value">${total}</div><div class="stat-label">simulados finalizados</div></div></article><article class="stat-card"><div><div class="stat-value">${avg}%</div><div class="stat-label">média de acerto</div></div></article><article class="stat-card"><div><div class="stat-value">${essays}</div><div class="stat-label">com redação</div></div></article>`;
  document.querySelector('#simHistoryList').innerHTML=rows.length?rows.map(x=>`<article class="timeline-item"><div class="timeline-date">${new Date(x.finalizadoEm).toLocaleDateString('pt-BR')}</div><div><h3>${escapeHtml(x.modelo||x.vestibular||'Simulado')}</h3><p>${x.acertos}/${x.totalQuestoes} acertos • ${formatDuration(x.duracaoSegundos)}${x.redacaoNota!=null?` • redação ${x.redacaoNota}/1000`:''}</p></div><span class="tag ${x.percentual>=70?'green':'yellow'}">${x.percentual}%</span></article>`).join(''):'<div class="empty-state small">Nenhum simulado finalizado ainda. Quando você concluir uma prova, o resultado vai aparecer aqui.</div>';
}
loadHistory();
})().catch(e=>{console.error(e);window.OMAVEST?.toast('Erro nos simulados: '+e.message)});
