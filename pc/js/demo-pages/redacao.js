(async function(){
const { mountShell, escapeHtml, toast, post } = window.OMAVEST;
await mountShell('redacao.html');
const presets={
  enem2025:{banca:'ENEM',tema:'Perspectivas acerca do envelhecimento na sociedade brasileira',genero:'Dissertativo-argumentativo',info:'ENEM 2025 • texto dissertativo-argumentativo, com proposta de intervenção. A redação oficial é avaliada em cinco competências.'},
  fuvest2026:{banca:'FUVEST',tema:'O perdão',genero:'Dissertativo-argumentativo ou carta',info:'FUVEST 2026 • as propostas tiveram o perdão como eixo e permitiram gêneros diferentes. Neste protótipo, escolha o formato que deseja treinar.'},
  unesp2026:{banca:'UNESP',tema:'Vivemos hoje uma epidemia da solidão?',genero:'Dissertativo-argumentativo',info:'UNESP 2026 • proposta reflexiva em formato dissertativo. O foco é tese, argumentação, coerência e domínio da escrita.'},
  unicamp2026a:{banca:'UNICAMP',tema:'A “machosfera” e o discurso de ódio contra as mulheres',genero:'Depoimento pessoal',info:'UNICAMP 2026 • proposta 1: depoimento pessoal em situação comunicativa definida pela banca.'},
  unicamp2026b:{banca:'UNICAMP',tema:'A importância histórica da Consolidação das Leis do Trabalho (CLT)',genero:'Nota de esclarecimento',info:'UNICAMP 2026 • proposta 2: nota de esclarecimento, com atenção ao gênero e à situação de circulação.'},
  enem2024:{banca:'ENEM',tema:'Desafios para a valorização da herança africana no Brasil',genero:'Dissertativo-argumentativo',info:'ENEM 2024 • tema oficial usado aqui apenas para treino de escrita.'},
  unesp2025:{banca:'UNESP',tema:'Medicalização da vida: a quem interessa?',genero:'Dissertativo-argumentativo',info:'UNESP 2025 • tema de treino baseado em edição anterior da banca.'},
  livre:{banca:'OMAVEST',tema:'',genero:'Livre',info:'Digite um tema próprio. O feedback continuará sendo demonstrativo e local.'}
};
const preset=document.querySelector('#essayPreset'),theme=document.querySelector('#essayTheme'),info=document.querySelector('#essayPresetInfo'),text=document.querySelector('#essayText');
function applyPreset(){const p=presets[preset.value]||presets.livre;if(preset.value!=='livre')theme.value=p.tema;info.innerHTML=`<strong>${escapeHtml(p.banca)}</strong> • ${escapeHtml(p.genero)}<br><span>${escapeHtml(p.info)}</span>`;}
preset.addEventListener('change',applyPreset);applyPreset();
text.oninput=()=>document.querySelector('#essayCount').textContent=`${text.value.length} caracteres`;
['copy','cut','paste','drop'].forEach(evt=>{
  text.addEventListener(evt,e=>{
    e.preventDefault();
    toast('Nesta versão do protótipo, copiar, colar e arrastar texto na redação estão desativados.');
  });
});
text.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&['v','c','x'].includes(String(e.key||'').toLowerCase())){
    e.preventDefault();
    toast('Copiar e colar estão desativados na área de redação.');
  }
});
document.querySelector('#correctEssay').onclick=async()=>{
  const btn=document.querySelector('#correctEssay');
  btn.disabled=true;btn.textContent='Analisando...';
  try{
    const p=presets[preset.value]||presets.livre;
    const r=await post('/api/ia/redacao',{banca:p.banca,genero:p.genero,tema:theme.value,texto:text.value,titulo:document.querySelector('#essayTitle').value||null});
    document.querySelector('#essayScore').textContent=r.nota!=null?`${r.nota}/${r.escala||1000}`:'Sem pontuação';
    document.querySelector('#essayFeedback').innerHTML=escapeHtml(r.feedback).replace(/\n/g,'<br>');
    document.querySelector('#essaySources').innerHTML=(r.fontes||[]).map(s=>`<div class="source">${escapeHtml(s.titulo)} • ${escapeHtml(s.fonte)}</div>`).join('');
  }catch(e){toast(e.message)}finally{btn.disabled=false;btn.textContent='Analisar redação'}
};
})().catch(function(e){ console.error(e); if(window.OMAVEST) window.OMAVEST.toast('Erro na demonstração: '+e.message); });
