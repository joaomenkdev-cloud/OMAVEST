(async function(){
const {mountShell,getCommunityPosts,createCommunityPost,toggleCommunityLike,addCommunityComment,getCommunityLinks,escapeHtml,toast,icon}=window.OMAVEST;
const heartIcon=(filled)=>`<svg class="icon icon-sm" viewBox="0 0 24 24" fill="${filled?'currentColor':'none'}" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.1C.6 8.9 1.9 5.4 5.3 5c2-.2 3.7.9 4.7 2.3C11 5.9 12.7 4.8 14.7 5c3.4.4 4.7 3.9 3.3 6.9-2.5 4.5-10 9.1-10 9.1Z"/></svg>`;
await mountShell('comunidade.html');
const tabs=[...document.querySelectorAll('[data-community-tab]')];
tabs.forEach(b=>b.onclick=()=>{tabs.forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('[data-community-panel]').forEach(p=>p.hidden=p.dataset.communityPanel!==b.dataset.communityTab)});
const feed=document.querySelector('#communityFeed');
function render(){
  const posts=getCommunityPosts();
  feed.innerHTML=posts.map(p=>`<article class="community-post"><div class="post-head"><div class="post-avatar">${escapeHtml(p.initial)}</div><div class="post-meta"><strong>${escapeHtml(p.author)}</strong><small>${escapeHtml(p.createdAt)}</small></div><span class="post-category">${escapeHtml(p.category)}</span></div><p class="post-text">${escapeHtml(p.text)}</p><div class="post-actions"><button class="post-action ${p.liked?'liked':''}" data-like="${p.id}">${heartIcon(p.liked)} ${p.likes} curtidas</button><button class="post-action" data-focus="${p.id}">${icon('messageCircle','icon-sm')} ${p.comments?.length||0} comentários</button></div><div class="comments">${(p.comments||[]).map(c=>`<div class="comment"><strong>${escapeHtml(c.author)}:</strong> ${escapeHtml(c.text)}</div>`).join('')}</div><form class="comment-form" data-form="${p.id}"><input placeholder="Escreva um comentário..."><button>Enviar</button></form></article>`).join('');
  feed.querySelectorAll('[data-like]').forEach(b=>b.onclick=()=>{toggleCommunityLike(b.dataset.like);render()});
  feed.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>feed.querySelector(`[data-form="${b.dataset.focus}"] input`)?.focus());
  feed.querySelectorAll('[data-form]').forEach(f=>f.onsubmit=e=>{e.preventDefault();try{addCommunityComment(f.dataset.form,f.querySelector('input').value);render()}catch(err){toast(err.message)}})
}
document.querySelector('#communityPublish').onclick=()=>{try{createCommunityPost(document.querySelector('#communityText').value,document.querySelector('#communityCategory').value);document.querySelector('#communityText').value='';render();toast('Publicado.')}catch(e){toast(e.message)}};
function links(){
  const l=getCommunityLinks();
  const items=[
    {title:'Discord',desc:'Servidor da comunidade OMAVEST para troca de dúvidas, avisos e interação entre estudantes.',cta:'Entrar no servidor',url:l.discord,badge:'Comunidade',className:'discord',symbol:'◎'},
    {title:'YouTube',desc:'Canal oficial do OMAVEST com conteúdos, atualizações e materiais de apoio.',cta:'Abrir canal',url:l.youtube,badge:'Conteúdo',className:'youtube',symbol:'▶'}
  ];
  document.querySelector('#communityLinks').innerHTML=items.map(item=>`<article class="card channel-card channel-card-${item.className}"><div class="channel-visual"><div class="channel-icon-badge">${item.symbol}</div></div><div class="channel-content"><div class="channel-top"><span class="tag yellow">${item.badge}</span><h3>${item.title}</h3></div><p>${item.desc}</p><div class="channel-actions">${item.url?`<a class="primary-btn" target="_blank" rel="noopener" href="${escapeHtml(item.url)}">${item.cta} ↗</a>`:'<span class="tag">link ainda não configurado</span>'}</div></div></article>`).join('')
}
render();
links();
})().catch(e=>{console.error(e);window.OMAVEST?.toast('Erro na comunidade: '+e.message)});
