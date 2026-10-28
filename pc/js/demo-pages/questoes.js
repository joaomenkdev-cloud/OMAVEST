(async function(){
const {mountShell,escapeHtml,toast,apiOr,post,icon,questionBodyHtml,alternativesHtml,scrollToEl}=window.OMAVEST;
await mountShell('questoes.html');

const PAGE_SIZE=10;
const els={vest:document.querySelector('#qVest'),subject:document.querySelector('#qSubject'),year:document.querySelector('#qYear')};
const sessionEl=document.querySelector('#questionSession');
const allResp=await apiOr('/api/questoes?limit=999',{data:[],total:0});
// Questões oficiais (print) aparecem primeiro; depois as autorais, das mais recentes para as mais antigas.
const allQuestions=(allResp.data||[]).sort((a,b)=>(b.imagem?1:0)-(a.imagem?1:0)||Number(b.ano)-Number(a.ano)||Number(a.id)-Number(b.id));
let filtered=[],shown=PAGE_SIZE;
const answers=new Map(); // questaoId -> resultado da correção nesta sessão

/* ---------- Abas (com navegação por setas, padrão ARIA de tabs) ---------- */
const tabs=[...document.querySelectorAll('[data-tab]')],panels=[...document.querySelectorAll('[data-panel]')];
function openTab(name,focus=false){
  if(!tabs.some(b=>b.dataset.tab===name))name='praticar';
  tabs.forEach(b=>{const on=b.dataset.tab===name;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');b.tabIndex=on?0:-1;if(on&&focus)b.focus();});
  panels.forEach(p=>p.classList.toggle('active',p.dataset.panel===name));
  history.replaceState(null,'','#'+name);
  if(name==='historico')loadHistory();
  if(name==='desempenho')loadPerformance();
}
tabs.forEach((b,i)=>{
  b.onclick=()=>openTab(b.dataset.tab);
  b.onkeydown=e=>{const step=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!step)return;e.preventDefault();openTab(tabs[(i+step+tabs.length)%tabs.length].dataset.tab,true);};
});

/* ---------- Filtros: vestibular, matéria e ano ---------- */
function setOptions(select,values,allLabel){
  const prev=select.value;
  select.innerHTML=`<option value="">${allLabel}</option>`+values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  select.value=values.map(String).includes(String(prev))?prev:'';
}
function refreshOptions(){
  const base=allQuestions.filter(q=>!els.vest.value||q.vestibular===els.vest.value);
  setOptions(els.subject,[...new Set(base.map(q=>q.materia))].sort((a,b)=>a.localeCompare(b,'pt-BR')),'Todas');
  const yearBase=base.filter(q=>!els.subject.value||q.materia===els.subject.value);
  setOptions(els.year,[...new Set(yearBase.map(q=>q.ano))].sort((a,b)=>b-a),'Todos');
}
function applyFilters(){
  const vest=els.vest.value,subject=els.subject.value,year=els.year.value;
  filtered=allQuestions.filter(q=>(!vest||q.vestibular===vest)&&(!subject||q.materia===subject)&&(!year||String(q.ano)===String(year)));
  shown=PAGE_SIZE;
  const prints=filtered.filter(q=>q.imagem).length;
  document.querySelector('#filterResultInfo').textContent=(filtered.length===1?'1 questão encontrada':`${filtered.length} questões encontradas`)+(prints?` • ${prints} em formato de print`:'');
  renderSession();
}
els.vest.addEventListener('change',()=>{refreshOptions();applyFilters();});
els.subject.addEventListener('change',()=>{refreshOptions();applyFilters();});
els.year.addEventListener('change',applyFilters);
document.querySelector('#clearFilters').onclick=()=>{els.vest.value='';els.subject.value='';els.year.value='';refreshOptions();applyFilters();};

/* ---------- Sessão de prática ---------- */
function tagsHtml(q){
  return `<span class="tag">${escapeHtml(q.vestibular)} ${escapeHtml(q.ano)}</span><span class="tag">${escapeHtml(q.materia)}</span><span class="tag">${escapeHtml(q.tema)}</span>${q.imagem?'<span class="tag green">Prova oficial</span>':'<span class="tag">Autoral</span>'}`;
}
function feedbackHtml(q,r){
  const title=r.correta?'Resposta correta':`Resposta incorreta: você marcou ${r.resposta}; a correta é ${r.respostaCorreta}`;
  return `<div class="answer-feedback ${r.correta?'ok':'bad'}" tabindex="-1"><strong>${icon(r.correta?'check':'x','icon-sm')} ${escapeHtml(title)}</strong><p>${escapeHtml(r.explicacao)}</p><small>${escapeHtml(r.fonte)}</small>
    <div class="ai-question-actions"><button class="ghost-btn ai-explain-btn" type="button" data-ai-q="${q.id}"${r.ai?' hidden':''}>${icon('sparkles','icon-sm')} Explicar com IA</button></div>
    <div class="ai-inline">${r.ai?`<div class="ai-inline-card"><strong>${icon('sparkles','icon-sm')} OMAVEST IA</strong><p>${escapeHtml(r.ai.resposta)}</p><small>Fonte: ${escapeHtml(r.ai.fonte)}</small></div>`:''}</div></div>`;
}
function questionCard(q,i){
  const r=answers.get(Number(q.id));
  const status=r?(r.correta?'is-right':'is-wrong'):'';
  const badge=r?` <span class="result-badge ${r.correta?'ok':'bad'}">${icon(r.correta?'check':'x','icon-sm')} ${r.correta?'Acertou':'Errou'}</span>`:'';
  return `<article class="question-card practice-question ${status}" id="questao-${q.id}" data-qcard="${q.id}" aria-labelledby="qtitle-${q.id}">
    <div class="question-topline"><h2 class="question-number" id="qtitle-${q.id}">QUESTÃO ${i+1}${badge}</h2><div class="question-tags">${tagsHtml(q)}</div></div>
    ${questionBodyHtml(q)}
    ${alternativesHtml(q,r?{selected:r.resposta,correct:r.respostaCorreta,locked:true}:{})}
    <div class="question-feedback" id="feedback-${q.id}" aria-live="polite">${r?feedbackHtml(q,r):''}</div>
  </article>`;
}
function sideHtml(list){
  const done=list.filter(q=>answers.has(Number(q.id)));
  const right=done.filter(q=>answers.get(Number(q.id)).correta).length,wrong=done.length-right;
  const chips=list.map((q,i)=>{
    const r=answers.get(Number(q.id)),cls=r?(r.correta?'ok':'bad'):'';
    const label=`Questão ${i+1}: ${r?(r.correta?'acertou':'errou'):'não respondida'}`;
    return `<button type="button" class="answer-chip ${cls}" data-goto="${q.id}" aria-label="${label}" title="${label}">${i+1}${r&&!r.correta?icon('x','icon-sm'):''}</button>`;
  }).join('');
  return `<h3 id="practiceTitle">Correção da sessão</h3>
    <div class="practice-count"><strong>${done.length}</strong><span>de ${list.length} respondidas</span></div>
    <div class="progress-track"><div class="progress-fill" style="width:${list.length?Math.round(done.length*100/list.length):0}%"></div></div>
    <div class="practice-score"><span class="tag green">${right} ${right===1?'acerto':'acertos'}</span><span class="tag red">${wrong} ${wrong===1?'erro':'erros'}</span></div>
    <div class="answer-map" role="group" aria-label="Mapa das questões">${chips}</div>
    <p class="muted">As questões erradas ficam marcadas em vermelho. Cada resposta entra no histórico e no desempenho.</p>
    <button id="finishPractice" class="primary-btn" type="button">Terminar e ver histórico</button>`;
}
function renderSession(){
  const list=filtered.slice(0,shown);
  if(!list.length){sessionEl.innerHTML='<div class="empty-state"><strong>Nenhuma questão encontrada.</strong><br>Experimente outro filtro ou clique em “Limpar”.</div>';return;}
  const rest=filtered.length-shown;
  sessionEl.innerHTML=`<div class="practice-layout"><div class="question-list">${list.map(questionCard).join('')}${rest>0?`<button id="loadMore" class="ghost-btn load-more" type="button">Carregar mais questões (${rest} ${rest===1?'restante':'restantes'})</button>`:''}</div>
    <aside class="card practice-side" id="practiceSide" aria-labelledby="practiceTitle">${sideHtml(list)}</aside></div>`;
}
function refreshCard(qid){
  const list=filtered.slice(0,shown),i=list.findIndex(q=>Number(q.id)===qid);if(i<0)return;
  const card=sessionEl.querySelector(`[data-qcard="${qid}"]`);
  if(card)card.outerHTML=questionCard(list[i],i);
  const side=sessionEl.querySelector('#practiceSide');if(side)side.innerHTML=sideHtml(list);
}
async function answer(qid,letter){
  if(answers.has(qid))return;
  try{
    const r=await post(`/api/questoes/${qid}/responder`,{resposta:letter});
    answers.set(qid,{resposta:letter,correta:r.correta,respostaCorreta:r.respostaCorreta,explicacao:r.explicacao,fonte:r.fonte});
    refreshCard(qid);
    // O botão clicado foi recriado; o foco vai para a correção, que também é anunciada pelo leitor de tela.
    sessionEl.querySelector(`#feedback-${qid} .answer-feedback`)?.focus({preventScroll:true});
  }catch(e){toast(e.message)}
}
async function explain(qid,btn){
  const r=answers.get(qid);if(!r)return;
  btn.disabled=true;btn.textContent='Analisando...';
  try{r.ai=await post('/api/ia/questao',{questaoId:qid,resposta:r.resposta});refreshCard(qid);}
  catch(e){toast(e.message);btn.disabled=false;btn.innerHTML=`${icon('sparkles','icon-sm')} Explicar com IA`;}
}
sessionEl.addEventListener('click',e=>{
  const alt=e.target.closest('.alternative[data-a]');
  if(alt&&!alt.disabled)return answer(Number(alt.dataset.q),alt.dataset.a);
  const ai=e.target.closest('[data-ai-q]');if(ai)return explain(Number(ai.dataset.aiQ),ai);
  const chip=e.target.closest('[data-goto]');if(chip)return scrollToEl(sessionEl.querySelector(`#questao-${chip.dataset.goto}`));
  if(e.target.closest('#loadMore')){const first=filtered[shown];shown+=PAGE_SIZE;renderSession();if(first)scrollToEl(sessionEl.querySelector(`#questao-${first.id}`));return;}
  if(e.target.closest('#finishPractice'))openTab('historico',true);
});

/* ---------- Histórico e desempenho ---------- */
async function loadHistory(){
  const r=await apiOr('/api/questoes/historico',{data:[]});const rows=r.data||[];
  const total=rows.length,correct=rows.filter(x=>x.correta).length,wrong=total-correct;
  document.querySelector('#questionHistoryStats').innerHTML=`<article class="stat-card"><div><div class="stat-value">${total}</div><div class="stat-label">respostas salvas</div></div></article><article class="stat-card"><div><div class="stat-value">${correct}</div><div class="stat-label">acertos</div></div></article><article class="stat-card stat-wrong"><div><div class="stat-value">${wrong}</div><div class="stat-label">erros para revisar</div></div></article>`;
  document.querySelector('#questionHistory').innerHTML=rows.length?rows.map(x=>{
    const title=x.imagem?`${x.vestibular} ${x.ano} • questão ${x.numeroOriginal} (prova oficial)`:x.enunciado;
    return `<article class="history-item ${x.correta?'is-right':'is-wrong'}"><div class="history-status ${x.correta?'ok':'bad'}">${icon(x.correta?'check':'x')}<span class="sr-only">${x.correta?'Acertou':'Errou'}</span></div><div class="history-main"><div class="history-meta"><span>${escapeHtml(x.vestibular)}</span><span>${escapeHtml(x.materia)}</span><span>${escapeHtml(x.tema)}</span><span>${new Date(x.respondidaEm).toLocaleString('pt-BR')}</span></div><h3>${escapeHtml(title)}</h3>${x.imagem?`<p class="history-excerpt">${escapeHtml(x.enunciado)}</p>`:''}<p>Você marcou <b class="${x.correta?'':'wrong-letter'}">${escapeHtml(x.resposta)}</b>. Resposta correta: <b>${escapeHtml(x.respostaCorreta)}</b>.</p><small>${escapeHtml(x.explicacao)}</small></div></article>`;
  }).join(''):'<div class="empty-state">Você ainda não respondeu questões.</div>';
}
async function loadPerformance(){
  const [p,sims]=await Promise.all([apiOr('/api/questoes/desempenho',{data:[],total:0,acertos:0}),apiOr('/api/simulados/historico',{data:[]})]);
  const pct=p.total?Math.round(p.acertos*100/p.total):0;
  document.querySelector('#questionSummary').innerHTML=`<article class="stat-card"><div><div class="stat-value">${p.total||0}</div><div class="stat-label">questões respondidas</div></div></article><article class="stat-card"><div><div class="stat-value">${p.acertos||0}</div><div class="stat-label">acertos</div></div></article><article class="stat-card"><div><div class="stat-value">${pct}%</div><div class="stat-label">taxa de acerto</div></div></article>`;
  document.querySelector('#questionPerformance').innerHTML=p.data.length?p.data.map(x=>`<article class="card performance-card"><div class="performance-head"><h3>${escapeHtml(x.materia)}</h3><strong>${x.percentual}%</strong></div><div class="progress-track"><div class="progress-fill ${x.percentual<60?'yellow':''}" style="width:${x.percentual}%"></div></div><p>${x.acertos} acertos em ${x.total} respostas.</p></article>`).join(''):'<div class="empty-state">Responda questões para gerar seu desempenho.</div>';
  document.querySelector('#simHistoryInline').innerHTML=sims.data.length?sims.data.map(x=>`<article class="timeline-item"><div class="timeline-date">${new Date(x.finalizadoEm).toLocaleDateString('pt-BR')}</div><div><h3>${escapeHtml(x.modelo||x.vestibular)}</h3><p>${x.acertos}/${x.totalQuestoes} acertos${x.redacaoNota!=null?` • redação ${x.redacaoNota}/1000`:''}</p></div><span class="tag ${x.percentual>=70?'green':'yellow'}">${x.percentual}%</span></article>`).join(''):'<div class="empty-state">Nenhum simulado finalizado.</div>';
}

refreshOptions();
applyFilters();
openTab(location.hash.slice(1)||'praticar');
})().catch(e=>{console.error(e);window.OMAVEST?.toast('Erro nas questões: '+e.message)});
