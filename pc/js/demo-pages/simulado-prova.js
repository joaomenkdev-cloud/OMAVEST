(async function(){
const {mountShell,escapeHtml,toast,post,getExamHandoff,setExamHandoff,clearExamHandoff,icon,questionBodyHtml,alternativesHtml,scrollToEl}=window.OMAVEST;
await mountShell('simulados.html');
const root=document.querySelector('#simExamRoot');
let handoff=getExamHandoff();
if(!handoff||!handoff.attemptId||!Array.isArray(handoff.questions)||!handoff.questions.length){
  root.innerHTML=`<article class="card"><h1>Nenhum simulado em andamento</h1><p>Escolha um modelo para iniciar uma nova prova.</p><a class="primary-btn" href="simulados.html">Voltar para Simulados</a></article>`;
  return;
}

const attempt=handoff.attemptId;
const questions=handoff.questions;
const meta=handoff.meta||{};
const answers=new Map(Object.entries(handoff.answers||{}).map(([k,v])=>[Number(k),String(v)]));
let timerId=null,finishing=false;
const durationSeconds=Number(handoff.totalSeconds||Number(meta.duracaoMinutos||10)*60);
const startedMs=new Date(meta.started||Date.now()).getTime();
const endMs=startedMs+durationSeconds*1000;

function format(sec){
  sec=Math.max(0,Math.floor(sec));
  const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
  return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function persist(){
  const essay=document.querySelector('#examEssay')?.value??handoff.redacao??'';
  handoff={...handoff,answers:Object.fromEntries(answers),redacao:essay};
  setExamHandoff(handoff);
}
function renderExam(){
  root.innerHTML=`
    <div class="page-heading exam-page-heading"><div><span class="tag yellow">${escapeHtml(meta.vestibular||'Simulado')}</span><h1>${escapeHtml(meta.modelo||'Simulado OMAVEST')}</h1><p>Responda no seu ritmo. O cronômetro continua mesmo se a página for recarregada.</p></div><a class="ghost-btn" href="simulados.html" id="leaveExam">Sair da prova</a></div>
    <div class="exam-bar">
      <div><strong>Prova em andamento</strong><span id="answeredCount">${answers.size}/${questions.length}</span></div>
      <div class="exam-clock">${icon('timer','icon-sm')} <span id="simTimer">--:--</span></div>
      <div><span class="tag">${questions.length} questões</span></div>
    </div>
    <div class="question-shell sim-exam-shell">
      <div>
        <div id="simQuestions" class="question-list">${questions.map((q,i)=>`<article class="question-card" data-exam-q="${q.id}" aria-labelledby="exam-qtitle-${q.id}">
          <div class="question-topline"><h2 class="question-number" id="exam-qtitle-${q.id}">QUESTÃO ${i+1}</h2><div class="question-tags"><span class="tag">${escapeHtml(q.materia)}</span><span class="tag">${escapeHtml(q.vestibular)}</span><span class="tag yellow">${escapeHtml(q.ano)}</span></div></div>
          ${questionBodyHtml(q)}
          ${alternativesHtml(q,{selected:answers.get(q.id)||'',toggle:true})}
        </article>`).join('')}</div>
        ${meta.temRedacao?`<article class="card essay-exam"><div class="page-mini-heading"><div><h2>Redação</h2><p>Tema de treino: ${escapeHtml(meta.temaRedacao||'Tema livre de vestibular')}</p></div><span id="essayCount" class="tag">0 caracteres</span></div><textarea id="examEssay" class="essay-area" placeholder="Escreva sua redação aqui...">${escapeHtml(handoff.redacao||'')}</textarea><p class="tiny">O feedback é demonstrativo e local.</p></article>`:''}
      </div>
      <aside class="card exam-side">
        <h3>Resumo da prova</h3>
        <div class="exam-progress"><strong id="examAnswered">${answers.size}</strong><span>de ${questions.length} respondidas</span></div>
        <div class="progress-track"><div id="examProgressFill" class="progress-fill" style="width:${Math.round(answers.size*100/questions.length)}%"></div></div>
        <p class="muted">Você pode deixar questões em branco e finalizar quando quiser.</p>
        <button id="finishSim" class="primary-btn" style="width:100%">Finalizar prova</button>
      </aside>
    </div>`;

  root.querySelectorAll('.alternative').forEach(b=>b.onclick=()=>{
    const qid=Number(b.dataset.q);
    root.querySelectorAll(`.alternative[data-q="${qid}"]`).forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false');});
    b.classList.add('selected');b.setAttribute('aria-pressed','true');
    answers.set(qid,b.dataset.a);
    document.querySelector('#answeredCount').textContent=`${answers.size}/${questions.length}`;
    document.querySelector('#examAnswered').textContent=answers.size;
    document.querySelector('#examProgressFill').style.width=`${Math.round(answers.size*100/questions.length)}%`;
    persist();
  });

  const essay=document.querySelector('#examEssay');
  if(essay){
    const count=()=>document.querySelector('#essayCount').textContent=`${essay.value.length} caracteres`;
    count();
    let saveTimer=null;
    essay.addEventListener('input',()=>{count();clearTimeout(saveTimer);saveTimer=setTimeout(persist,250)});
  }
  document.querySelector('#finishSim').onclick=()=>finish(false);
  document.querySelector('#leaveExam').onclick=e=>{
    if(!confirm('Sair do simulado? Seu progresso ficará salvo enquanto esta tentativa estiver ativa.'))e.preventDefault();
    else persist();
  };
}

async function finish(auto){
  if(finishing)return;
  if(!auto&&!answers.size&&!document.querySelector('#examEssay')?.value.trim()){
    toast('Responda ao menos uma questão ou escreva a redação.');
    return;
  }
  finishing=true;
  if(timerId)clearInterval(timerId);
  persist();
  try{
    const r=await post(`/api/simulados/${attempt}/finalizar`,{
      respostas:[...answers].map(([questaoId,resposta])=>({questaoId,resposta})),
      redacao:document.querySelector('#examEssay')?.value||''
    });
    clearExamHandoff();
    const byId=new Map(r.resultado.map(x=>[Number(x.questaoId),x]));
    const blank=r.resultado.filter(x=>!x.respostaAluno).length,wrong=r.total-r.acertos-blank;
    root.innerHTML=`<article class="card sim-result">
      <span class="tag ${r.percentual>=70?'green':'yellow'}">${auto?'Tempo encerrado':'Finalizado'}</span>
      <h1>Resultado do simulado</h1>
      <div class="result-score">${r.percentual}%</div>
      <p>${r.acertos} ${r.acertos===1?'acerto':'acertos'}, ${wrong} ${wrong===1?'erro':'erros'} e ${blank} em branco, em ${r.total} ${r.total===1?'questão':'questões'}.</p>
      ${r.redacao?`<div class="essay-result"><strong>Redação: ${r.redacao.nota}/1000</strong><p>${escapeHtml(r.redacao.aviso)}</p></div>`:''}
      <div class="answer-map" role="group" aria-label="Mapa da correção">${questions.map((q,i)=>{const x=byId.get(Number(q.id)),ok=!!x?.correta,label=`Questão ${i+1}: ${ok?'acertou':x?.respostaAluno?'errou':'em branco'}`;return `<button type="button" class="answer-chip ${ok?'ok':'bad'}" data-goto="${q.id}" aria-label="${label}" title="${label}">${i+1}${ok?'':icon('x','icon-sm')}</button>`;}).join('')}</div>
      <div class="content-actions"><a class="primary-btn" href="questoes.html#desempenho">Ver histórico e desempenho</a><a class="ghost-btn" href="simulados.html">Novo simulado</a></div>
    </article>
    <h2 class="section-title">Correção da prova</h2>
    <p class="muted correction-hint">As questões erradas ou deixadas em branco aparecem em vermelho; a alternativa correta fica em verde.</p>
    <div class="question-list correction-list">${questions.map((q,i)=>correctionCard(q,i,byId.get(Number(q.id)))).join('')}</div>`;
    root.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>scrollToEl(root.querySelector(`#corr-${b.dataset.goto}`)));
    scrollToEl(root.querySelector('.sim-result h1'));
  }catch(e){
    finishing=false;
    toast(e.message);
  }
}

// Questão corrigida: errada ou em branco fica em vermelho; a alternativa correta aparece em verde.
function correctionCard(q,i,x){
  const marked=x?.respostaAluno||'',ok=!!x?.correta,label=ok?'Acertou':marked?'Errou':'Em branco';
  const title=ok?'Resposta correta':marked?`Você marcou ${marked}; a correta é ${x?.respostaCorreta}`:`Questão em branco; a correta é ${x?.respostaCorreta}`;
  return `<article class="question-card ${ok?'is-right':'is-wrong'}" id="corr-${q.id}" aria-labelledby="corr-title-${q.id}">
    <div class="question-topline"><h3 class="question-number" id="corr-title-${q.id}">QUESTÃO ${i+1} <span class="result-badge ${ok?'ok':'bad'}">${icon(ok?'check':'x','icon-sm')} ${label}</span></h3><div class="question-tags"><span class="tag">${escapeHtml(q.materia)}</span><span class="tag">${escapeHtml(q.vestibular)} ${escapeHtml(q.ano)}</span></div></div>
    ${questionBodyHtml(q)}
    ${alternativesHtml(q,{selected:marked,correct:x?.respostaCorreta||'',locked:true})}
    <div class="answer-feedback ${ok?'ok':'bad'}"><strong>${icon(ok?'check':'x','icon-sm')} ${escapeHtml(title)}</strong><p>${escapeHtml(x?.explicacao||'')}</p><small>${escapeHtml(x?.fonte||'')}</small></div>
  </article>`;
}

renderExam();
function tick(){
  const remaining=Math.max(0,Math.ceil((endMs-Date.now())/1000));
  const el=document.querySelector('#simTimer');if(el)el.textContent=format(remaining);
  if(remaining<=0){clearInterval(timerId);timerId=null;finish(true);}
}
tick();
timerId=setInterval(tick,1000);
window.addEventListener('beforeunload',()=>{persist();if(timerId)clearInterval(timerId)});
})().catch(e=>{console.error(e);window.OMAVEST?.toast('Erro na prova: '+e.message)});
