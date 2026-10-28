(function(){
  'use strict';
  const ICONS={
    home:'<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"/>',
    calendar:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16"/><path d="M8 3v4"/><path d="M16 3v4"/>',
    timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/><path d="M9 2h6"/>',
    archive:'<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/>',
    checkCircle:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
    layers:'<rect x="5" y="4" width="12" height="8" rx="1.5" transform="rotate(-6 11 8)"/><rect x="7" y="9" width="12" height="8" rx="1.5"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17.5" cy="9" r="2.3"/><path d="M15.7 14.2a5 5 0 0 1 4.8 5"/>',
    pen:'<path d="M4 20h16"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4.5 1L4.5 14.5 16.5 3.5Z"/>',
    cap:'<path d="M2 9 12 4l10 5-10 5-10-5Z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v6"/>',
    heart:'<path d="M12 21s-7.5-4.6-10-9.1C.6 8.9 1.9 5.4 5.3 5c2-.2 3.7.9 4.7 2.3C11 5.9 12.7 4.8 14.7 5c3.4.4 4.7 3.9 3.3 6.9-2.5 4.5-10 9.1-10 9.1Z"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 13a8 8 0 0 0 0-2l2-1.4-2-3.4-2.3.9a8 8 0 0 0-1.7-1L15 3h-4l-.4 2.1a8 8 0 0 0-1.7 1l-2.3-.9-2 3.4L6.6 11a8 8 0 0 0 0 2l-2 1.4 2 3.4 2.3-.9a8 8 0 0 0 1.7 1L11 21h4l.4-2.1a8 8 0 0 0 1.7-1l2.3.9 2-3.4-2-1.4Z"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.8 2.8 0 1 1 3.9 2.6c-.9.4-1.4 1-1.4 2"/><path d="M12 17h.01"/>',
    sun:'<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12H5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    moon:'<path d="M20 14.5a8.5 8.5 0 1 1-9-11 7 7 0 0 0 9 11Z"/>',
    flame:'<path d="M12 22c4 0 7-2.7 7-6.7 0-3.4-2-5.3-2.9-7.5-.6 1.6-1.5 2.4-2.2 2.4-.1-2.6-1.6-5-3.9-6.2.4 2-.1 3.7-1.4 5.3C6.9 11.4 5 13 5 15.6 5 19.4 8 22 12 22Z"/>',
    percent:'<path d="M5 19 19 5"/><circle cx="7" cy="7" r="2.3"/><circle cx="17" cy="17" r="2.3"/>',
    hourglass:'<path d="M7 2h10"/><path d="M7 22h10"/><path d="M7 2c0 4.5 4 5.5 4 8s-4 3.5-4 8"/><path d="M17 2c0 4.5-4 5.5-4 8s4 3.5 4 8"/>',
    sparkles:'<path d="M12 2 13.8 9.2 21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-1.8Z"/>',
    check:'<path d="M5 12.5 10 17 19 7"/>',
    x:'<path d="M6 6l12 12M18 6 6 18"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-3.8-3.8"/>',
    chevronRight:'<path d="M9 5l7 7-7 7"/>',
    messageCircle:'<path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A8 8 0 1 1 21 12Z"/>',
    play:'<circle cx="12" cy="12" r="9"/><path d="M10 8.5 16 12l-6 3.5Z"/>',
    bookOpen:'<path d="M12 6.5C10.5 5 8 4.3 5 4.5v13c3 0 5.5.7 7 2.2 1.5-1.5 4-2.2 7-2.2v-13c-3-.2-5.5.5-7 2Z"/><path d="M12 6.5V19.7"/>',
  };
  function icon(name,cls){
    return `<svg class="icon${cls?' '+cls:''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||''}</svg>`;
  }
  const THEME_KEY='omavest_theme_v1';
  let state=null;
  function getStoredTheme(){
    try{
      const saved=localStorage.getItem(THEME_KEY);
      if(saved==='light'||saved==='dark') return saved;
    }catch{}
    return 'dark';
  }
  let currentTheme=getStoredTheme();
  function refreshThemeControls(){
    const isDark=currentTheme==='dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(btn=>{
      btn.innerHTML=icon(isDark?'sun':'moon');
      btn.setAttribute('aria-label',isDark?'Ativar modo claro':'Ativar modo escuro');
      btn.title=isDark?'Ativar modo claro':'Ativar modo escuro';
    });
    document.querySelectorAll('[data-theme-choice]').forEach(btn=>{
      const selected=btn.dataset.themeChoice===currentTheme;
      btn.classList.toggle('selected',selected);
      btn.setAttribute('aria-pressed',selected?'true':'false');
    });
  }
  function setTheme(theme){
    currentTheme=theme==='light'?'light':'dark';
    document.documentElement.dataset.theme=currentTheme;
    try{localStorage.setItem(THEME_KEY,currentTheme)}catch{}
    if(state){ state.theme=currentTheme; saveState(); }
    refreshThemeControls();
    return currentTheme;
  }
  function toggleTheme(){ return setTheme(currentTheme==='dark'?'light':'dark'); }
  setTheme(currentTheme);
  const PREFIX='__OMAVEST_DEMO__:';
  const now=new Date();
  const iso=(offset)=>{const d=new Date(); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10)};
  const clone=(x)=>JSON.parse(JSON.stringify(x));
  const defaultState=()=>({
    user:null,
    accounts:[{name:'Aluno Demo',email:'demo@omavest.com',password:'123456'}],
    profile:{nome:'Aluno Demo',email:'demo@omavest.com',vestibularAlvo:'ENEM',dataVestibular:iso(128),minutosPorDia:120,diasDisponiveis:'1,2,3,4,5'},
    progress:{1:78,4:62,6:54,7:81,12:70},
    favorites:[8,12],
    questionHistory:[
      {id:1,questaoId:1,resposta:'D',correta:true,respondidaEm:new Date(Date.now()-3*864e5).toISOString()},
      {id:2,questaoId:3,resposta:'A',correta:false,respondidaEm:new Date(Date.now()-2*864e5).toISOString()},
      {id:3,questaoId:7,resposta:'C',correta:true,respondidaEm:new Date(Date.now()-1*864e5).toISOString()}
    ],
    nextQuestionHistory:4,
    completedSchedule:[],
    studyPlan:null,
    trail:null,
    simHistory:[{id:1,vestibular:'ENEM',iniciadoEm:new Date(Date.now()-12*864e5).toISOString(),finalizadoEm:new Date(Date.now()-12*864e5+5400000).toISOString(),totalQuestoes:10,acertos:7,percentual:70}],
    activeAttempts:{},
    examHandoff:null,
    nextAttempt:2,
    communityPosts:[
      {id:1,author:'Marina S.',initial:'M',category:'Redação',text:'Alguém tem uma dica para melhorar a proposta de intervenção na redação do ENEM?',createdAt:'Hoje • 14:20',likes:8,liked:false,comments:[{author:'Lucas',text:'Eu separo em agente, ação, meio e finalidade antes de escrever a conclusão.'}]},
      {id:2,author:'Rafael P.',initial:'R',category:'Matemática',text:'Função quadrática finalmente começou a fazer sentido depois que passei a desenhar a parábola em cada exercício.',createdAt:'Hoje • 11:05',likes:14,liked:false,comments:[]},
      {id:3,author:'Bianca M.',initial:'B',category:'Vestibulares',text:'Lembrete: vale conferir os calendários oficiais das universidades antes de montar o cronograma final de revisão.',createdAt:'Ontem • 19:42',likes:21,liked:false,comments:[{author:'Aluno Demo',text:'Boa! Coloquei isso no meu cronograma também.'}]}
    ],
    nextCommunityPost:4,
    communityLinks:{discord:'https://discord.gg/kPTPrRhwz',youtube:'https://www.youtube.com/channel/UCjPDSXZSQTCbN0D2bCLgeGg'},
    donations:[],
    theme:null
  });
  function loadState(){
    let raw='';
    // Em file:// cada navegador pode tratar o localStorage de forma diferente entre arquivos.
    // window.name viaja com a aba e, por isso, é a fonte mais confiável durante a navegação offline.
    try{ if(typeof window.name==='string' && window.name.startsWith(PREFIX)) raw=window.name.slice(PREFIX.length); }catch{}
    if(!raw){ try{ raw=localStorage.getItem('omavest_demo_state_v1')||''; }catch{} }
    if(raw){ try{ const parsed=JSON.parse(raw); return Object.assign(defaultState(),parsed); }catch{} }
    return defaultState();
  }
  state=loadState();
  if(state.theme==='light'||state.theme==='dark') setTheme(state.theme);
  else { state.theme=currentTheme; saveState(); }
  function saveState(){
    const raw=JSON.stringify(state);
    try{localStorage.setItem('omavest_demo_state_v1',raw)}catch{}
    try{window.name=PREFIX+raw}catch{}
  }
  function syncWindowName(){ try{window.name=PREFIX+JSON.stringify(state)}catch{} }
  syncWindowName();

  const disciplines=[
    {id:1,nome:'Matemática',slug:'matematica',icone:'calculator',cor:'amarelo',ordem:1,descricao:'Álgebra, geometria, funções, estatística e resolução de problemas.'},
    {id:2,nome:'Português',slug:'portugues',icone:'book-open',cor:'verde',ordem:2,descricao:'Interpretação, gramática, literatura e produção textual.'},
    {id:3,nome:'História',slug:'historia',icone:'landmark',cor:'cinza',ordem:3,descricao:'História do Brasil e geral com foco nos vestibulares.'},
    {id:4,nome:'Biologia',slug:'biologia',icone:'dna',cor:'verde',ordem:4,descricao:'Citologia, genética, ecologia, fisiologia e evolução.'},
    {id:5,nome:'Física',slug:'fisica',icone:'atom',cor:'amarelo',ordem:5,descricao:'Mecânica, eletricidade, ondas, termologia e óptica.'},
    {id:6,nome:'Química',slug:'quimica',icone:'flask-conical',cor:'verde',ordem:6,descricao:'Química geral, físico-química e orgânica.'},
    {id:7,nome:'Geografia',slug:'geografia',icone:'globe-2',cor:'cinza',ordem:7,descricao:'Espaço geográfico, geopolítica, clima e questões socioambientais.'},
    {id:8,nome:'Redação',slug:'redacao',icone:'pen-line',cor:'amarelo',ordem:8,descricao:'Estrutura dissertativo-argumentativa, repertório e competências do ENEM.'}
  ];
  const themes=[
    {id:1,disciplinaId:1,nome:'Funções e progressões',slug:'funcoes-progressoes',ordem:1},
    {id:2,disciplinaId:1,nome:'Geometria',slug:'geometria',ordem:2},
    {id:3,disciplinaId:2,nome:'Interpretação de texto',slug:'interpretacao-texto',ordem:1},
    {id:4,disciplinaId:2,nome:'Literatura',slug:'literatura',ordem:2},
    {id:5,disciplinaId:3,nome:'Brasil República',slug:'brasil-republica',ordem:1},
    {id:6,disciplinaId:4,nome:'Genética',slug:'genetica',ordem:1},
    {id:7,disciplinaId:4,nome:'Divisão celular',slug:'divisao-celular',ordem:2},
    {id:8,disciplinaId:5,nome:'Mecânica',slug:'mecanica',ordem:1},
    {id:9,disciplinaId:6,nome:'Estequiometria',slug:'estequiometria',ordem:1},
    {id:10,disciplinaId:7,nome:'Geopolítica',slug:'geopolitica',ordem:1},
    {id:11,disciplinaId:8,nome:'Redação ENEM',slug:'redacao-enem',ordem:1}
  ];
  const contents=[
    {id:1,temaId:1,titulo:'Função do 1º grau',descricao:'Aprenda a interpretar coeficientes, gráficos e problemas com funções afins.',tipo:'material',dificuldade:'media',duracaoMinutos:30,fonte:'Acervo OMAVEST',textoBase:'Uma função afim pode ser escrita como f(x)=ax+b. O coeficiente a indica a taxa de variação e b representa o valor inicial. Em problemas de vestibular, identifique as grandezas, determine a relação entre elas e interprete o gráfico como uma reta.'},
    {id:2,temaId:1,titulo:'Função do 2º grau',descricao:'Raízes, vértice, concavidade e aplicações da função quadrática.',tipo:'videoaula',dificuldade:'media',duracaoMinutos:35,fonte:'Acervo OMAVEST',textoBase:'A função quadrática tem forma f(x)=ax²+bx+c, com a diferente de zero. As raízes podem ser obtidas pela fórmula de Bhaskara e o vértice ajuda a analisar máximos e mínimos. O sinal de a determina a concavidade da parábola.'},
    {id:3,temaId:2,titulo:'Áreas e semelhança',descricao:'Relações entre áreas, triângulos semelhantes e proporcionalidade.',tipo:'lista',dificuldade:'media',duracaoMinutos:40,fonte:'Acervo OMAVEST',textoBase:'Em geometria plana, relacione áreas, razões de semelhança e propriedades de triângulos. Figuras semelhantes preservam ângulos e possuem lados correspondentes proporcionais. A razão entre áreas é o quadrado da razão de semelhança.'},
    {id:4,temaId:3,titulo:'Estratégias de interpretação',descricao:'Técnicas para localizar informações, inferir sentidos e comparar alternativas.',tipo:'material',dificuldade:'facil',duracaoMinutos:25,fonte:'Acervo OMAVEST',textoBase:'Interpretação exige localizar informações explícitas, inferir relações implícitas, reconhecer o ponto de vista e observar elementos de coesão. Leia o comando antes de comparar as alternativas e evite escolher respostas apenas por palavras repetidas no texto.'},
    {id:5,temaId:4,titulo:'Modernismo brasileiro',descricao:'Contexto, fases e características cobradas nos vestibulares.',tipo:'resumo',dificuldade:'media',duracaoMinutos:30,fonte:'Acervo OMAVEST',textoBase:'O Modernismo brasileiro reuniu projetos estéticos diversos, valorizando experimentação formal, revisão crítica da identidade nacional e aproximação da linguagem cotidiana. Em vestibulares, relacione obra, contexto histórico e características de cada fase.'},
    {id:6,temaId:5,titulo:'Primeira República',descricao:'Coronelismo, economia cafeeira e movimentos de contestação.',tipo:'material',dificuldade:'media',duracaoMinutos:35,fonte:'Acervo OMAVEST',textoBase:'A Primeira República brasileira, de 1889 a 1930, foi marcada por federalismo, poder das oligarquias regionais, conflitos sociais e transformações urbanas. Questões costumam relacionar coronelismo, economia cafeeira e movimentos de contestação.'},
    {id:7,temaId:6,titulo:'Leis de Mendel',descricao:'Segregação dos alelos e resolução de cruzamentos simples.',tipo:'videoaula',dificuldade:'media',duracaoMinutos:30,fonte:'Acervo OMAVEST',textoBase:'A primeira lei de Mendel descreve a segregação dos alelos durante a formação dos gametas. Em cruzamentos simples, organize os genótipos parentais, determine os gametas possíveis e calcule as proporções esperadas nos descendentes.'},
    {id:8,temaId:7,titulo:'Mitose e meiose',descricao:'Compare os dois processos de divisão celular e suas funções.',tipo:'material',dificuldade:'media',duracaoMinutos:30,fonte:'Acervo OMAVEST',textoBase:'Mitose conserva o número de cromossomos e origina duas células geneticamente semelhantes, sendo importante para crescimento e reparo. Meiose reduz o número cromossômico pela metade e gera variabilidade genética, participando da formação de gametas.'},
    {id:9,temaId:8,titulo:'Leis de Newton',descricao:'Inércia, força resultante e ação e reação.',tipo:'lista',dificuldade:'media',duracaoMinutos:40,fonte:'Acervo OMAVEST',textoBase:'As leis de Newton relacionam movimento e forças. A primeira descreve a inércia, a segunda relaciona força resultante, massa e aceleração, e a terceira trata de pares de ação e reação em corpos distintos.'},
    {id:10,temaId:9,titulo:'Relações molares',descricao:'Balanceamento, mol e proporções estequiométricas.',tipo:'material',dificuldade:'media',duracaoMinutos:35,fonte:'Acervo OMAVEST',textoBase:'Estequiometria usa a equação química balanceada para relacionar quantidades de reagentes e produtos. Converta dados para mol, aplique a proporção dos coeficientes e depois retorne à unidade solicitada.'},
    {id:11,temaId:10,titulo:'Globalização e blocos econômicos',descricao:'Fluxos globais, integração econômica e desigualdades.',tipo:'resumo',dificuldade:'media',duracaoMinutos:30,fonte:'Acervo OMAVEST',textoBase:'A globalização amplia fluxos de capitais, mercadorias, informações e pessoas, mas ocorre de forma desigual. Blocos econômicos buscam reduzir barreiras e intensificar relações entre países em diferentes graus de integração.'},
    {id:12,temaId:11,titulo:'Estrutura dissertativo-argumentativa',descricao:'Tese, desenvolvimento, conclusão e proposta de intervenção.',tipo:'material',dificuldade:'media',duracaoMinutos:45,fonte:'Guia de Redação OMAVEST',textoBase:'Uma redação dissertativo-argumentativa apresenta uma tese clara, desenvolve argumentos articulados e conclui retomando o projeto de texto. No ENEM, a proposta de intervenção deve respeitar os direitos humanos e detalhar ação, agente, meio e finalidade.'},
    {id:13,temaId:11,titulo:'Coesão e repertório',descricao:'Conectivos, progressão temática e uso produtivo de repertório.',tipo:'material',dificuldade:'media',duracaoMinutos:35,fonte:'Guia de Redação OMAVEST',textoBase:'Coesão conecta ideias por pronomes, conjunções, retomadas e progressão temática. O repertório deve ser pertinente ao tema e integrado ao argumento, evitando citações decorativas sem relação com a tese.'}
  ];
  function enrich(c){const t=themes.find(x=>x.id===c.temaId),d=disciplines.find(x=>x.id===t.disciplinaId);return Object.assign({},c,{tema:t.nome,disciplina:d.nome,disciplinaSlug:d.slug,gratuito:true})}
  const questions=[
    {id:1,vestibular:'ENEM',materia:'Matemática',tema:'Funções',ano:2026,dificuldade:'facil',enunciado:'Uma função afim é dada por f(x)=2x+3. Qual é o valor de f(4)?',alternativas:{A:'7',B:'8',C:'10',D:'11',E:'12'},resposta:'D',explicacao:'Substitua x por 4: 2·4+3=11.',fonte:'Questão autoral OMAVEST • estilo ENEM'},
    {id:2,vestibular:'FUVEST',materia:'Matemática',tema:'Porcentagem',ano:2026,dificuldade:'media',enunciado:'Um produto de R$ 200 recebeu desconto de 15%. Qual é o preço final?',alternativas:{A:'R$ 170',B:'R$ 175',C:'R$ 180',D:'R$ 185',E:'R$ 190'},resposta:'A',explicacao:'15% de 200 é 30; 200-30=170.',fonte:'Questão autoral OMAVEST • estilo FUVEST'},
    {id:3,vestibular:'UNICAMP',materia:'Biologia',tema:'Divisão celular',ano:2026,dificuldade:'media',enunciado:'Qual processo reduz pela metade o número de cromossomos na formação de gametas?',alternativas:{A:'Mitose',B:'Meiose',C:'Bipartição',D:'Brotamento',E:'Clonagem'},resposta:'B',explicacao:'A meiose é uma divisão reducional associada à formação de gametas.',fonte:'Questão autoral OMAVEST • estilo UNICAMP'},
    {id:4,vestibular:'UNESP',materia:'Biologia',tema:'Genética',ano:2026,dificuldade:'facil',enunciado:'Em um indivíduo heterozigoto Aa, quais alelos podem estar presentes nos gametas?',alternativas:{A:'Apenas A',B:'Apenas a',C:'A e a',D:'AA e aa',E:'Aa apenas'},resposta:'C',explicacao:'Os alelos se segregam e cada gameta recebe A ou a.',fonte:'Questão autoral OMAVEST • estilo UNESP'},
    {id:5,vestibular:'ENEM',materia:'Português',tema:'Interpretação',ano:2025,dificuldade:'media',enunciado:'Em uma questão de interpretação, uma inferência é:',alternativas:{A:'uma cópia literal do texto',B:'uma conclusão apoiada em pistas do texto',C:'uma opinião sem evidência',D:'um erro gramatical',E:'um título obrigatório'},resposta:'B',explicacao:'Inferir é concluir algo não dito literalmente, mas sustentado pelo texto.',fonte:'Questão autoral OMAVEST • estilo ENEM'},
    {id:6,vestibular:'FUVEST',materia:'História',tema:'Brasil República',ano:2025,dificuldade:'media',enunciado:'O coronelismo na Primeira República relaciona-se principalmente:',alternativas:{A:'à industrialização pesada estatal',B:'ao poder político local de grandes proprietários',C:'ao voto secreto universal',D:'à centralização monárquica',E:'à abolição das eleições'},resposta:'B',explicacao:'O coronelismo envolvia redes locais de poder e controle político-eleitoral.',fonte:'Questão autoral OMAVEST • estilo FUVEST'},
    {id:7,vestibular:'UNESP',materia:'Física',tema:'Mecânica',ano:2025,dificuldade:'media',enunciado:'Um corpo de massa 2 kg sofre força resultante de 10 N. Qual é sua aceleração?',alternativas:{A:'2 m/s²',B:'4 m/s²',C:'5 m/s²',D:'8 m/s²',E:'20 m/s²'},resposta:'C',explicacao:'Pela segunda lei de Newton, a=F/m=10/2=5 m/s².',fonte:'Questão autoral OMAVEST • estilo UNESP'},
    {id:8,vestibular:'UNICAMP',materia:'Química',tema:'Estequiometria',ano:2025,dificuldade:'media',enunciado:'Na equação 2H₂ + O₂ → 2H₂O, quantos mol de água são formados por 2 mol de H₂ com O₂ em excesso?',alternativas:{A:'0,5 mol',B:'1 mol',C:'2 mol',D:'3 mol',E:'4 mol'},resposta:'C',explicacao:'A proporção estequiométrica é 2 mol de H₂ para 2 mol de H₂O.',fonte:'Questão autoral OMAVEST • estilo UNICAMP'},
    {id:9,vestibular:'ENEM',materia:'Geografia',tema:'Geopolítica',ano:2025,dificuldade:'media',enunciado:'Uma característica dos blocos econômicos é:',alternativas:{A:'proibir todo comércio externo',B:'reduzir barreiras entre países membros',C:'eliminar moedas obrigatoriamente',D:'abolir fronteiras políticas',E:'encerrar fluxos de capitais'},resposta:'B',explicacao:'Blocos econômicos buscam facilitar trocas e integração entre seus membros.',fonte:'Questão autoral OMAVEST • estilo ENEM'},
    {id:10,vestibular:'FUVEST',materia:'Português',tema:'Literatura',ano:2025,dificuldade:'media',enunciado:'Uma característica associada ao Modernismo brasileiro é:',alternativas:{A:'rejeição de toda linguagem cotidiana',B:'experimentação formal e revisão da identidade nacional',C:'retorno obrigatório ao latim',D:'negação do contexto brasileiro',E:'uniformidade estética absoluta'},resposta:'B',explicacao:'O Modernismo reuniu experimentação formal e releituras críticas da identidade nacional.',fonte:'Questão autoral OMAVEST • estilo FUVEST'},
    {id:11,vestibular:'ENEM',materia:'Matemática',tema:'Estatística',ano:2024,dificuldade:'facil',enunciado:'As notas 6, 8, 7 e 9 têm média aritmética igual a:',alternativas:{A:'6,5',B:'7',C:'7,5',D:'8',E:'8,5'},resposta:'C',explicacao:'A soma é 30 e 30/4 = 7,5.',fonte:'Questão autoral OMAVEST • estilo ENEM'},
    {id:12,vestibular:'UNESP',materia:'Matemática',tema:'Geometria',ano:2024,dificuldade:'media',enunciado:'Um retângulo mede 8 cm por 5 cm. Sua área é:',alternativas:{A:'13 cm²',B:'26 cm²',C:'40 cm²',D:'80 cm²',E:'20 cm²'},resposta:'C',explicacao:'Área do retângulo = base × altura = 8×5 = 40 cm².',fonte:'Questão autoral OMAVEST • estilo UNESP'},
    {id:13,vestibular:'UNICAMP',materia:'Física',tema:'Energia',ano:2024,dificuldade:'media',enunciado:'Um aparelho de 1000 W ligado por 2 horas consome:',alternativas:{A:'0,5 kWh',B:'1 kWh',C:'2 kWh',D:'1000 kWh',E:'2000 kWh'},resposta:'C',explicacao:'1000 W = 1 kW; energia = 1 kW × 2 h = 2 kWh.',fonte:'Questão autoral OMAVEST • estilo UNICAMP'},
    {id:14,vestibular:'FUVEST',materia:'Química',tema:'Soluções',ano:2024,dificuldade:'dificil',enunciado:'Uma solução contém 20 g de soluto em 200 mL de solução. A concentração comum é:',alternativas:{A:'10 g/L',B:'20 g/L',C:'50 g/L',D:'100 g/L',E:'200 g/L'},resposta:'D',explicacao:'200 mL = 0,2 L; C=m/V=20/0,2=100 g/L.',fonte:'Questão autoral OMAVEST • estilo FUVEST'},
    {id:15,vestibular:'ENEM',materia:'Biologia',tema:'Ecologia',ano:2024,dificuldade:'media',enunciado:'Em uma cadeia alimentar, os produtores são organismos que:',alternativas:{A:'alimentam-se de outros seres',B:'produzem matéria orgânica a partir de fontes inorgânicas',C:'atuam apenas como decompositores',D:'ocupam sempre o último nível trófico',E:'não participam do fluxo de energia'},resposta:'B',explicacao:'Produtores, como plantas e algas, sintetizam matéria orgânica e iniciam o fluxo de energia.',fonte:'Questão autoral OMAVEST • estilo ENEM'},
    {id:16,vestibular:'UNESP',materia:'História',tema:'Era Vargas',ano:2024,dificuldade:'media',enunciado:'Uma característica do Estado Novo foi:',alternativas:{A:'amplo pluripartidarismo',B:'fortalecimento do poder central e autoritarismo',C:'fim da legislação trabalhista',D:'retorno imediato da monarquia',E:'autonomia total dos estados'},resposta:'B',explicacao:'O Estado Novo concentrou poderes no Executivo e restringiu liberdades políticas.',fonte:'Questão autoral OMAVEST • estilo UNESP'},
    {id:17,vestibular:'FUVEST',materia:'Geografia',tema:'Climatologia',ano:2023,dificuldade:'media',enunciado:'A urbanização intensa pode favorecer ilhas de calor porque:',alternativas:{A:'reduz superfícies impermeáveis',B:'aumenta vegetação nativa',C:'materiais urbanos absorvem e retêm calor',D:'elimina fontes de calor antrópico',E:'aumenta a umidade de forma uniforme'},resposta:'C',explicacao:'Concreto e asfalto absorvem calor, e a menor vegetação reduz o resfriamento por evapotranspiração.',fonte:'Questão autoral OMAVEST • estilo FUVEST'},
    {id:18,vestibular:'UNICAMP',materia:'Português',tema:'Gramática',ano:2023,dificuldade:'media',enunciado:'Na frase “Os estudantes chegaram cedo”, o núcleo do sujeito é:',alternativas:{A:'chegaram',B:'cedo',C:'os',D:'estudantes',E:'os estudantes chegaram'},resposta:'D',explicacao:'O sujeito é “Os estudantes” e seu núcleo é o substantivo “estudantes”.',fonte:'Questão autoral OMAVEST • estilo UNICAMP'},
    {id:19,vestibular:'ENEM',materia:'Física',tema:'Eletricidade',ano:2023,dificuldade:'media',enunciado:'Um resistor de 10 Ω é submetido a 20 V. A corrente elétrica é:',alternativas:{A:'0,5 A',B:'1 A',C:'2 A',D:'10 A',E:'200 A'},resposta:'C',explicacao:'Pela lei de Ohm, I=V/R=20/10=2 A.',fonte:'Questão autoral OMAVEST • estilo ENEM'},
    {id:20,vestibular:'UNESP',materia:'Química',tema:'pH',ano:2023,dificuldade:'dificil',enunciado:'Uma solução com pH 3 é classificada como:',alternativas:{A:'ácida',B:'neutra',C:'básica',D:'sempre salina',E:'sem íons H⁺'},resposta:'A',explicacao:'Em condições usuais, pH menor que 7 indica meio ácido.',fonte:'Questão autoral OMAVEST • estilo UNESP'},
    {id:21,vestibular:'FUVEST',materia:'Biologia',tema:'Fisiologia',ano:2023,dificuldade:'media',enunciado:'A principal função das hemácias é:',alternativas:{A:'produzir anticorpos',B:'transportar gases respiratórios',C:'digerir lipídios',D:'produzir hormônios',E:'formar impulsos nervosos'},resposta:'B',explicacao:'A hemoglobina das hemácias participa principalmente do transporte de oxigênio.',fonte:'Questão autoral OMAVEST • estilo FUVEST'},
    {id:22,vestibular:'UNICAMP',materia:'História',tema:'Revolução Industrial',ano:2023,dificuldade:'media',enunciado:'A Revolução Industrial contribuiu para:',alternativas:{A:'redução da urbanização',B:'expansão do trabalho fabril e das cidades',C:'fim da produção mecanizada',D:'retorno ao feudalismo',E:'extinção do comércio internacional'},resposta:'B',explicacao:'A industrialização ampliou a produção fabril e acelerou a urbanização.',fonte:'Questão autoral OMAVEST • estilo UNICAMP'},
    {id:23,vestibular:'ENEM',materia:'Português',tema:'Coesão',ano:2026,dificuldade:'media',enunciado:'Em um texto argumentativo, conectivos como “portanto” e “desse modo” ajudam principalmente a:',alternativas:{A:'eliminar a tese',B:'estabelecer relações lógicas entre ideias',C:'substituir todos os verbos',D:'retirar a conclusão',E:'impedir a progressão temática'},resposta:'B',explicacao:'Conectivos explicitam relações de conclusão, causa, oposição e outras relações lógico-discursivas.',fonte:'Questão autoral OMAVEST • estilo ENEM'},
    {id:24,vestibular:'FUVEST',materia:'Matemática',tema:'Probabilidade',ano:2026,dificuldade:'dificil',enunciado:'Ao lançar um dado honesto de seis faces, a probabilidade de obter um número par é:',alternativas:{A:'1/6',B:'1/3',C:'1/2',D:'2/3',E:'5/6'},resposta:'C',explicacao:'Há três resultados pares (2, 4, 6) em seis resultados possíveis: 3/6=1/2.',fonte:'Questão autoral OMAVEST • estilo FUVEST'},
    {id:25,vestibular:'ENEM',materia:'Biologia',tema:'Ecologia',ano:2025,dificuldade:'media',enunciado:'Em um ecossistema, a diminuição acentuada de uma população de predadores pode provocar, inicialmente:',alternativas:{A:'redução imediata de todas as presas',B:'aumento de algumas populações de presas',C:'fim da competição por alimento',D:'interrupção total do fluxo de energia',E:'desaparecimento dos produtores'},resposta:'B',explicacao:'Com menos predadores, algumas populações de presas podem aumentar até que outros fatores limitantes atuem.',fonte:'Questão autoral OMAVEST • estilo ENEM'},
  ];
  const provas=[
    {id:1,titulo:'ENEM 2025 • cadernos e gabaritos',ano:2025,instituicao:'ENEM',area:'Geral',fonte:'INEP • acervo oficial',oficial:true,acervoUrl:'https://riep.inep.gov.br/collections/22b39e5c-3238-4414-9faf-7db037247175',descricao:'Coleção oficial do INEP com cadernos e gabaritos do ENEM. Requer internet para abrir a fonte.'},
    {id:2,titulo:'ENEM 2024 • cadernos e gabaritos',ano:2024,instituicao:'ENEM',area:'Geral',fonte:'INEP • acervo oficial',oficial:true,acervoUrl:'https://riep.inep.gov.br/collections/22b39e5c-3238-4414-9faf-7db037247175',descricao:'Acesso ao repositório oficial de provas e gabaritos do ENEM.'},
    {id:3,titulo:'ENEM 2023 • cadernos e gabaritos',ano:2023,instituicao:'ENEM',area:'Geral',fonte:'INEP • acervo oficial',oficial:true,acervoUrl:'https://riep.inep.gov.br/collections/22b39e5c-3238-4414-9faf-7db037247175',descricao:'Acesso ao repositório oficial de provas e gabaritos do ENEM.'},
    {id:4,titulo:'FUVEST 2026 • 1ª e 2ª fases',ano:2026,instituicao:'FUVEST',area:'Geral',fonte:'FUVEST • acervo oficial',oficial:true,acervoUrl:'https://www.fuvest.br/acervo-vestibular-2026/',descricao:'Provas, gabaritos e respostas esperadas do Vestibular USP 2026.'},
    {id:5,titulo:'FUVEST 2025 • 1ª e 2ª fases',ano:2025,instituicao:'FUVEST',area:'Geral',fonte:'FUVEST • acervo oficial',oficial:true,acervoUrl:'https://www.fuvest.br/acervo-vestibular-2025',descricao:'Provas e gabaritos do Vestibular USP 2025.'},
    {id:6,titulo:'FUVEST • acervo histórico',ano:2024,instituicao:'FUVEST',area:'Geral',fonte:'FUVEST • acervo oficial',oficial:true,acervoUrl:'https://www.fuvest.br/acervo-vestibular',descricao:'Acervo histórico da FUVEST com exames de diferentes anos.'},
    {id:7,titulo:'UNESP 2026 • provas e gabaritos',ano:2026,instituicao:'UNESP',area:'Geral',fonte:'VUNESP • página oficial',oficial:true,acervoUrl:'https://www.vunesp.com.br/VNSP2504',descricao:'Página oficial do Vestibular UNESP 2026, com seção de provas e gabaritos.'},
    {id:8,titulo:'UNESP 2025 • provas e gabaritos',ano:2025,instituicao:'UNESP',area:'Geral',fonte:'VUNESP • página oficial',oficial:true,acervoUrl:'https://www.vunesp.com.br/VNSP2404',descricao:'Página oficial do Vestibular UNESP 2025.'},
    {id:9,titulo:'UNESP 2024 • provas e gabaritos',ano:2024,instituicao:'UNESP',area:'Geral',fonte:'VUNESP • página oficial',oficial:true,acervoUrl:'https://www.vunesp.com.br/VNSP2303/',descricao:'Página oficial do Vestibular UNESP 2024.'},
    {id:10,titulo:'UNICAMP • provas e simulados anteriores',ano:2026,instituicao:'UNICAMP',area:'Geral',fonte:'COMVEST • portal oficial',oficial:true,acervoUrl:'https://www.comvest.unicamp.br/',descricao:'A COMVEST disponibiliza materiais e simulados com questões de edições anteriores.'},
    {id:11,titulo:'UNICAMP • acervo 2025',ano:2025,instituicao:'UNICAMP',area:'Geral',fonte:'COMVEST • portal oficial',oficial:true,acervoUrl:'https://www.comvest.unicamp.br/',descricao:'Use o portal oficial da COMVEST para consultar provas e respostas.'},
    {id:12,titulo:'UNICAMP • acervo 2024',ano:2024,instituicao:'UNICAMP',area:'Geral',fonte:'COMVEST • portal oficial',oficial:true,acervoUrl:'https://www.comvest.unicamp.br/',descricao:'Use o portal oficial da COMVEST para consultar provas e respostas.'}
  ];
  const simModels=[
    {id:'enem1',titulo:'ENEM • 1º dia',instituicao:'ENEM',quantidadeQuestoes:90,duracaoMinutos:330,temRedacao:true,temaRedacao:'Perspectivas acerca do envelhecimento na sociedade brasileira',materias:['Português','História','Geografia'],limiteLocal:8,descricao:'Linguagens, Ciências Humanas e redação, com cronômetro de referência do 1º dia.'},
    {id:'enem2',titulo:'ENEM • 2º dia',instituicao:'ENEM',quantidadeQuestoes:90,duracaoMinutos:300,temRedacao:false,materias:['Matemática','Biologia','Física','Química'],limiteLocal:8,descricao:'Matemática e Ciências da Natureza, com treino de gestão de tempo.'},
    {id:'fuvest1',titulo:'FUVEST • 1ª fase',instituicao:'FUVEST',quantidadeQuestoes:80,duracaoMinutos:300,temRedacao:false,materias:[],limiteLocal:7,descricao:'Referência 2027: 80 questões de múltipla escolha em 5 horas.'},
    {id:'fuvest2',titulo:'FUVEST • Português + Redação',instituicao:'FUVEST',quantidadeQuestoes:10,duracaoMinutos:240,temRedacao:true,temaRedacao:'O perdão',materias:['Português'],limiteLocal:7,descricao:'Treino inspirado no primeiro dia da 2ª fase, com Português e produção textual.'},
    {id:'unicamp1',titulo:'UNICAMP • 1ª fase',instituicao:'UNICAMP',quantidadeQuestoes:72,duracaoMinutos:300,temRedacao:false,materias:[],limiteLocal:5,descricao:'Referência recente: prova geral objetiva com até 5 horas.'},
    {id:'unicamp2',titulo:'UNICAMP • Redação',instituicao:'UNICAMP',quantidadeQuestoes:6,duracaoMinutos:180,temRedacao:true,temaRedacao:'A “machosfera” e o discurso de ódio contra as mulheres',materias:['Português'],limiteLocal:5,descricao:'Treino de escrita inspirado na 2ª fase, que trabalha gêneros textuais e situações comunicativas.'},
    {id:'unesp1',titulo:'UNESP • 1ª fase',instituicao:'UNESP',quantidadeQuestoes:90,duracaoMinutos:300,temRedacao:false,materias:[],limiteLocal:5,descricao:'Treino de conhecimentos gerais no formato objetivo da 1ª fase.'},
    {id:'unesp2',titulo:'UNESP • Redação + revisão',instituicao:'UNESP',quantidadeQuestoes:12,duracaoMinutos:240,temRedacao:true,temaRedacao:'Vivemos hoje uma epidemia da solidão?',materias:['Português','História','Geografia'],limiteLocal:5,descricao:'Treino adaptado ao protótipo com redação e questões de revisão.'}
  ];
  const universities=[
    {id:1,nome:'Universidade de São Paulo',sigla:'USP',vestibular:'FUVEST',localizacao:'São Paulo • SP',siteOficial:'https://www.fuvest.br/',descricao:'Universidade pública com ingresso principal pela FUVEST e vagas pelo ENEM-USP.'},
    {id:2,nome:'Universidade Estadual de Campinas',sigla:'UNICAMP',vestibular:'COMVEST',localizacao:'Campinas • SP',siteOficial:'https://www.comvest.unicamp.br/',descricao:'Universidade pública com vestibular próprio organizado pela COMVEST.'},
    {id:3,nome:'Universidade Estadual Paulista',sigla:'UNESP',vestibular:'VUNESP',localizacao:'São Paulo • SP',siteOficial:'https://www.vunesp.com.br/',descricao:'Universidade pública multicampi com vestibular organizado pela VUNESP.'},
    {id:4,nome:'Universidade Federal de São Carlos',sigla:'UFSCar',vestibular:'SISU/ENEM',localizacao:'São Carlos • SP',siteOficial:'https://www.ufscar.br/',descricao:'Universidade federal com ingresso em ampla parte das vagas pelo SISU usando a nota do ENEM.'}
  ];
  const calendar=[
    {id:1,instituicao:'ENEM',evento:'Período previsto de preparação final',dataInicio:iso(58),tipo:'prova'},
    {id:2,instituicao:'FUVEST',evento:'1ª fase • acompanhar calendário oficial',dataInicio:iso(78),tipo:'prova'},
    {id:3,instituicao:'UNICAMP',evento:'1ª fase • acompanhar calendário oficial',dataInicio:iso(92),tipo:'prova'},
    {id:4,instituicao:'UNESP',evento:'Vestibular • acompanhar calendário oficial',dataInicio:iso(106),tipo:'prova'}
  ];
  function scheduleSeed(){
    const labels={0:'Dom',1:'Seg',2:'Ter',3:'Qua',4:'Qui',5:'Sex',6:'Sáb'};
    const slots=state.studyPlan?.weeklySlots?.length?state.studyPlan.weeklySlots:[
      {diaSemana:1,materia:'Matemática',inicio:'18:00',duracaoMinutos:60},
      {diaSemana:2,materia:'Português',inicio:'18:00',duracaoMinutos:60},
      {diaSemana:3,materia:'Biologia',inicio:'18:00',duracaoMinutos:60},
      {diaSemana:4,materia:'Física',inicio:'18:00',duracaoMinutos:60},
      {diaSemana:5,materia:'Redação',inicio:'18:00',duracaoMinutos:90}
    ];
    const order={1:1,2:2,3:3,4:4,5:5,6:6,0:7};
    return slots.slice().sort((a,b)=>(order[a.diaSemana]||9)-(order[b.diaSemana]||9)).map((x,i)=>({
      id:i+1,dia:labels[Number(x.diaSemana)]||'',diaSemana:Number(x.diaSemana),disciplina:String(x.materia||x.disciplina||'Estudo'),horaInicio:String(x.inicio||x.horaInicio||'18:00'),minutosPlanejados:Number(x.duracaoMinutos||x.duracao||60)
    }));
  }
  function saveWeeklyPlan(opts={}){
    const weeklySlots=(opts.weeklySlots||[]).map(x=>({
      diaSemana:Number(x.diaSemana),
      materia:String(x.materia||x.disciplina||'Matemática'),
      inicio:String(x.inicio||x.horaInicio||'18:00'),
      duracaoMinutos:Math.max(15,Math.min(240,Number(x.duracaoMinutos||x.duracao||60)))
    })).filter(x=>Number.isInteger(x.diaSemana)&&x.diaSemana>=0&&x.diaSemana<=6);
    if(!weeklySlots.length) throw new Error('Escolha pelo menos um dia de estudo.');
    state.studyPlan={vestibular:String(opts.vestibular||state.profile.vestibularAlvo||'ENEM'),dataProva:opts.dataProva||state.profile.dataVestibular,weeklySlots,salvoEm:new Date().toISOString()};
    state.profile.vestibularAlvo=state.studyPlan.vestibular;
    if(state.studyPlan.dataProva) state.profile.dataVestibular=state.studyPlan.dataProva;
    state.profile.diasDisponiveis=weeklySlots.map(x=>x.diaSemana).join(',');
    state.profile.minutosPorDia=Math.round(weeklySlots.reduce((a,x)=>a+x.duracaoMinutos,0)/weeklySlots.length);
    saveState();
    return clone(state.studyPlan);
  }
  function getContentRows(){return contents.map(enrich)}
  function requireUser(){if(!state.user) throw new Error('Faça login para continuar.');}
  function queryObj(path){const u=new URL(path,'https://demo.omavest.local');return {pathname:u.pathname,search:u.searchParams}}
  async function demoApi(path,options={}){
    await new Promise(r=>setTimeout(r,90));
    const method=String(options.method||'GET').toUpperCase(); let body={};
    try{body=options.body?JSON.parse(options.body):{}}catch{}
    const {pathname,search}=queryObj(path);
    if(pathname==='/api/dashboard'){
      const schedule=scheduleSeed(); const pvals=Object.values(state.progress).map(Number); const avg=pvals.length?Math.round(pvals.reduce((a,b)=>a+b,0)/pvals.length):0;
      const sim=state.simHistory; const simQ=sim.reduce((a,x)=>a+(x.totalQuestoes||0),0), simHits=sim.reduce((a,x)=>a+(x.acertos||0),0); const qh=state.questionHistory||[]; const qtotal=simQ+qh.length, hits=simHits+qh.filter(x=>x.correta).length;
      const days=Math.max(0,Math.ceil((new Date(state.profile.dataVestibular+'T12:00:00')-new Date())/864e5));
      return {success:true,demo:true,usuario:{nome:state.user?.displayName||state.profile.nome,vestibularAlvo:state.profile.vestibularAlvo},estatisticas:{diasParaVestibular:days,diasSequencia:7,questoesResolvidas:qtotal||34,mediaAcertos:qtotal?Math.round(hits*100/qtotal):74},cronograma:schedule.slice(0,5),proximos:calendar.slice(0,3),progresso:[]};
    }
    if(pathname==='/api/acervo/disciplinas') return {success:true,data:disciplines.map(d=>Object.assign({},d,{temas:themes.filter(t=>t.disciplinaId===d.id).length,conteudos:contents.filter(c=>themes.find(t=>t.id===c.temaId)?.disciplinaId===d.id).length}))};
    let m=pathname.match(/^\/api\/acervo\/disciplinas\/([^/]+)$/); if(m){const d=disciplines.find(x=>x.slug===decodeURIComponent(m[1])); if(!d) throw new Error('Disciplina não encontrada.'); return {success:true,data:Object.assign({},d,{temas:themes.filter(t=>t.disciplinaId===d.id).map(t=>Object.assign({},t,{conteudos:contents.filter(c=>c.temaId===t.id).map(c=>Object.assign({},c,{gratuito:true}))}))})};}
    if(pathname==='/api/acervo/conteudos'){
      let rows=getContentRows(); const busca=(search.get('busca')||'').toLowerCase(),tipo=search.get('tipo')||'',disc=search.get('disciplina')||''; const lim=Number(search.get('limite')||50);
      if(busca) rows=rows.filter(c=>`${c.titulo} ${c.descricao} ${c.textoBase}`.toLowerCase().includes(busca)); if(tipo) rows=rows.filter(c=>c.tipo===tipo); if(disc) rows=rows.filter(c=>c.disciplina===disc||c.disciplinaSlug===disc); return {success:true,data:rows.slice(0,lim),total:rows.length};
    }
    m=pathname.match(/^\/api\/acervo\/conteudos\/(\d+)$/); if(m){const c=contents.find(x=>x.id===Number(m[1])); if(!c) throw new Error('Conteúdo não encontrado.'); return {success:true,data:enrich(c)};}
    if(pathname==='/api/perfil'){
      requireUser();
      if(method==='PUT'){
        state.profile=Object.assign({},state.profile,body,{email:body.email||state.user.email});
        if(body.nome){
          state.user.displayName=body.nome;
          const acc=state.accounts.find(a=>a.email.toLowerCase()===String(state.user.email||'').toLowerCase());
          if(acc) acc.name=body.nome;
        }
        saveState();
      }
      return {success:true,data:clone(state.profile)};
    }
    if(pathname==='/api/progresso' && method==='POST'){requireUser(); state.progress[body.conteudoId]=body.concluido?100:Math.max(0,Math.min(100,Number(body.percentual||0)));saveState();return {success:true,data:{conteudoId:body.conteudoId,percentual:state.progress[body.conteudoId],concluido:state.progress[body.conteudoId]>=100}};}
    if(pathname==='/api/progresso'){
      requireUser(); const groups={}; for(const [id,p] of Object.entries(state.progress)){const c=contents.find(x=>x.id===Number(id)); if(!c)continue; const e=enrich(c); if(!groups[e.disciplina])groups[e.disciplina]=[];groups[e.disciplina].push(Number(p));} const data=Object.entries(groups).map(([disciplina,v])=>({disciplina,percentual:Math.round(v.reduce((a,b)=>a+b,0)/v.length),concluidos:v.filter(x=>x>=100).length,total:v.length}));return {success:true,data};
    }
    if(pathname==='/api/favoritos/alternar' && method==='POST'){requireUser();const id=Number(body.conteudoId),i=state.favorites.indexOf(id);let fav=true;if(i>=0){state.favorites.splice(i,1);fav=false}else state.favorites.push(id);saveState();return {success:true,favorito:fav};}
    if(pathname==='/api/favoritos'){requireUser();return {success:true,data:state.favorites.map(id=>contents.find(c=>c.id===id)).filter(Boolean).map(c=>{const e=enrich(c);return {conteudoId:c.id,criadoEm:new Date().toISOString(),titulo:c.titulo,tipo:c.tipo,tema:e.tema,disciplina:e.disciplina}})};}
    if(pathname==='/api/cronograma') {requireUser();return {success:true,data:scheduleSeed(),plano:clone(state.studyPlan)};}
    if(pathname==='/api/cronograma/resumo'){requireUser();const rows=scheduleSeed();const total=rows.reduce((a,x)=>a+Number(x.minutosPlanejados||0),0);const days=state.profile.dataVestibular?Math.max(0,Math.ceil((new Date(state.profile.dataVestibular+'T12:00:00')-new Date())/864e5)):0;return {success:true,data:{sessoes:rows.length,minutosSemanais:total,diasParaProva:days}};}
    if(pathname==='/api/cronograma/planejamento' && method==='POST'){requireUser();return {success:true,data:saveWeeklyPlan(body)};}
    if(pathname==='/api/cronograma/gerar' && method==='POST'){requireUser();return {success:true,gerados:0,data:[],plano:saveWeeklyPlan(body)};}
    if(pathname==='/api/trilhas/minha'){requireUser();return {success:true,data:clone(state.trail)};}
    if(pathname==='/api/trilhas/gerar'&&method==='POST'){requireUser();const prio=(body.disciplinasDificuldade||[]).map(x=>String(x).toLowerCase());let rows=getContentRows().sort((a,b)=>(prio.includes(b.disciplina.toLowerCase())?1:0)-(prio.includes(a.disciplina.toLowerCase())?1:0)); rows=rows.slice(0,12); state.trail={id:1,nome:`Trilha ${body.vestibular||'ENEM'}`,vestibular:body.vestibular||'ENEM',descricao:'Trilha demonstrativa gerada com prioridade nas disciplinas indicadas.',criadoEm:new Date().toISOString(),itens:rows.map((c,i)=>({ordem:i+1,conteudoId:c.id,obrigatorio:true,titulo:c.titulo,tipo:c.tipo,tema:c.tema,disciplina:c.disciplina}))};saveState();return {success:true,trilhaId:1,itens:rows.length};}
    if(pathname==='/api/calendario-vestibulares') return {success:true,data:clone(calendar),aviso:'Datas demonstrativas. Confirme sempre os calendários oficiais.'};
    if(pathname==='/api/universidades'){let rows=clone(universities);const q=(search.get('busca')||'').toLowerCase();if(q)rows=rows.filter(u=>`${u.nome} ${u.sigla} ${u.vestibular}`.toLowerCase().includes(q));return {success:true,data:rows};}
    if(pathname==='/api/provas') {let rows=clone(provas);const inst=(search.get('instituicao')||'').toUpperCase(),ano=search.get('ano')||'';if(inst)rows=rows.filter(x=>x.instituicao===inst);if(ano)rows=rows.filter(x=>String(x.ano)===ano);return {success:true,data:rows};}
    if(pathname==='/api/questoes/materias'){const g={};questions.forEach(q=>g[q.materia]=(g[q.materia]||0)+1);return {success:true,data:Object.keys(g).sort().map(materia=>({materia,total:g[materia]}))};}
    if(pathname==='/api/questoes/metadados'){return {success:true,data:{vestibulares:[...new Set(questions.map(q=>q.vestibular))].sort(),materias:[...new Set(questions.map(q=>q.materia))].sort(),temas:[...new Set(questions.map(q=>q.tema))].sort(),anos:[...new Set(questions.map(q=>q.ano))].sort((a,b)=>b-a),dificuldades:['facil','media','dificil']}};}
    if(pathname==='/api/questoes/temas'){const mat=search.get('materia')||'';let rows=questions;if(mat)rows=rows.filter(q=>q.materia===mat);return {success:true,data:[...new Set(rows.map(q=>q.tema))].sort()};}
    if(pathname==='/api/questoes/historico'){requireUser();const data=(state.questionHistory||[]).slice().sort((a,b)=>new Date(b.respondidaEm)-new Date(a.respondidaEm)).map(h=>{const q=questions.find(x=>x.id===h.questaoId);return Object.assign({},h,{materia:q?.materia||'',tema:q?.tema||'',vestibular:q?.vestibular||'',ano:q?.ano||'',enunciado:q?.enunciado||'',imagem:q?.imagem||'',numeroOriginal:q?.numeroOriginal||null,respostaCorreta:q?.resposta||'',explicacao:q?.explicacao||''})});return {success:true,data};}
    if(pathname==='/api/questoes/desempenho'){requireUser();const hist=state.questionHistory||[];const map={};hist.forEach(h=>{const q=questions.find(x=>x.id===h.questaoId);if(!q)return;const k=q.materia;map[k]=map[k]||{materia:k,total:0,acertos:0};map[k].total++;if(h.correta)map[k].acertos++;});const data=Object.values(map).map(x=>Object.assign(x,{percentual:x.total?Math.round(x.acertos*100/x.total):0})).sort((a,b)=>b.total-a.total);return {success:true,data,total:hist.length,acertos:hist.filter(x=>x.correta).length};}
    let qm=pathname.match(/^\/api\/questoes\/(\d+)\/responder$/);if(qm&&method==='POST'){requireUser();const q=questions.find(x=>x.id===Number(qm[1]));if(!q)throw new Error('Questão não encontrada.');const selected=String(body.resposta||'').toUpperCase(),correta=selected===q.resposta;const h={id:state.nextQuestionHistory++,questaoId:q.id,resposta:selected,correta,respondidaEm:new Date().toISOString()};state.questionHistory=Array.isArray(state.questionHistory)?state.questionHistory:[];state.questionHistory.unshift(h);saveState();return {success:true,correta,respostaCorreta:q.resposta,explicacao:q.explicacao,fonte:q.fonte,historicoId:h.id};}
    m=pathname.match(/^\/api\/questoes\/(\d+)\/explicacao$/); if(m){const q=questions.find(x=>x.id===Number(m[1])); if(!q)throw new Error('Questão não encontrada.');return {success:true,resposta:q.resposta,explicacao:q.explicacao,fonte:q.fonte};}
    if(pathname==='/api/questoes'){
      let rows=clone(questions);const mat=search.get('materia'),tema=search.get('tema'),dif=search.get('dificuldade'),ano=search.get('ano'),vest=search.get('vestibular'),status=search.get('status'),busca=(search.get('busca')||'').toLowerCase(),limit=Number(search.get('limit')||50);
      if(mat)rows=rows.filter(x=>x.materia===mat);if(tema)rows=rows.filter(x=>x.tema===tema);if(dif)rows=rows.filter(x=>x.dificuldade===dif);if(ano)rows=rows.filter(x=>String(x.ano)===ano);if(vest)rows=rows.filter(x=>x.vestibular===vest);if(busca)rows=rows.filter(x=>`${x.enunciado} ${x.materia} ${x.tema}`.toLowerCase().includes(busca));
      if(status){rows=rows.filter(q=>{const last=(state.questionHistory||[]).find(h=>h.questaoId===q.id);if(status==='nao-resolvidas')return !last;if(status==='corretas')return !!last?.correta;if(status==='erradas')return !!last&&!last.correta;return true;});}
      const total=rows.length;rows=rows.sort((a,b)=>(b.imagem?1:0)-(a.imagem?1:0)||b.ano-a.ano||a.id-b.id).slice(0,limit).map(({resposta,explicacao,...x})=>x);return {success:true,data:rows,total};
    }
    if(pathname==='/api/simulados/modelos') return {success:true,data:clone(simModels)};
    if(pathname==='/api/simulados'&&method==='POST'){
      requireUser();let rows=questions.slice();const model=simModels.find(x=>x.id===body.modeloId);const mats=(body.materias?.length?body.materias:(model?.materias||[])).filter(Boolean);const vest=body.vestibular||model?.instituicao||'';
      if(mats.length)rows=rows.filter(q=>mats.includes(q.materia));if(vest&&vest!=='Geral') {const vrows=rows.filter(q=>q.vestibular===vest);if(vrows.length>=3)rows=vrows;}
      rows=rows.sort(()=>Math.random()-.5);const requested=Number(body.quantidade||model?.quantidadeQuestoes||10);const maxLocal=Math.min(rows.length,Number(body.limiteDemo||12));rows=rows.slice(0,Math.max(1,Math.min(requested,maxLocal)));
      if(!rows.length)throw new Error('Não há questões para os filtros escolhidos.');const id=state.nextAttempt++;const dur=Number(body.duracaoMinutos||model?.duracaoMinutos||90);state.activeAttempts[id]={vestibular:vest||'Geral',modelo:model?.titulo||'Simulado personalizado',ids:rows.map(q=>q.id),started:new Date().toISOString(),duracaoMinutos:dur,temRedacao:!!(body.temRedacao??model?.temRedacao),temaRedacao:body.temaRedacao||model?.temaRedacao||''};saveState();return {success:true,tentativaId:id,meta:clone(state.activeAttempts[id]),data:rows.map(({resposta,explicacao,...q})=>clone(q))};
    }
    m=pathname.match(/^\/api\/simulados\/(\d+)\/finalizar$/); if(m&&method==='POST'){
      requireUser();const id=Number(m[1]),at=state.activeAttempts[id];if(!at)throw new Error('Tentativa não encontrada.');let hits=0;const answerMap=new Map((body.respostas||[]).map(a=>[Number(a.questaoId),String(a.resposta||'').toUpperCase()]));const resultado=at.ids.map(qid=>{const q=questions.find(x=>x.id===qid),resp=answerMap.get(qid)||'',correta=!!q&&resp===q.resposta;if(correta)hits++;return {questaoId:q?.id,correta,respostaAluno:resp,respostaCorreta:q?.resposta||'',explicacao:q?.explicacao||'',fonte:q?.fonte||'OMAVEST'};});const total=at.ids.length,percentual=Math.round(hits*100/total);let redacao=null;const text=String(body.redacao||'').trim();if(at.temRedacao&&text){let score=620+Math.min(140,Math.floor(text.length/10));if(/portanto|assim|dessa forma|desse modo/i.test(text))score+=40;if(/sociedade|estado|educa|cidad|polít|polit/i.test(text))score+=30;score=Math.max(0,Math.min(920,Math.round(score/20)*20));redacao={nota:score,notaEstimada:score,caracteres:text.length,tema:at.temaRedacao,aviso:'Pontuação demonstrativa local; não equivale à correção oficial.'};}
      const ended=new Date();const durationSeconds=Math.max(0,Math.round((ended-new Date(at.started))/1000));state.simHistory.unshift({id,vestibular:at.vestibular,modelo:at.modelo,iniciadoEm:at.started,finalizadoEm:ended.toISOString(),totalQuestoes:total,acertos:hits,percentual,duracaoSegundos:durationSeconds,redacaoNota:redacao?.nota||redacao?.notaEstimada||null,respondidas:answerMap.size,temaRedacao:at.temaRedacao||'',temRedacao:!!at.temRedacao});delete state.activeAttempts[id];saveState();return {success:true,acertos:hits,total,percentual,resultado,redacao};
    }
    if(pathname==='/api/simulados/historico'){requireUser();return {success:true,data:clone(state.simHistory)};}
    if(pathname==='/api/ia/questao'&&method==='POST'){
      requireUser();
      const q=questions.find(x=>x.id===Number(body.questaoId));
      if(!q) throw new Error('Questão não encontrada.');
      const resposta=String(body.resposta||'').toUpperCase();
      const acertou=resposta===q.resposta;
      const dicaMateria={Matemática:'refaça o raciocínio passo a passo e confira as unidades',Biologia:'relacione o conceito ao processo biológico cobrado',Português:'volte ao comando e identifique a evidência textual',História:'localize período, agentes e relações de causa e consequência',Geografia:'associe o fenômeno ao espaço, escala e contexto',Física:'liste os dados e a grandeza física antes de escolher a fórmula',Química:'identifique as espécies e as relações quantitativas envolvidas',Filosofia:'identifique o autor, o conceito central e a tese defendida no trecho',Redação:'observe tese, argumento, coesão e adequação ao gênero'};
      return {success:true,resposta:`${acertou?'Sua resposta está correta.':'A alternativa correta é '+q.resposta+'.'} ${q.explicacao} Para revisar, ${dicaMateria[q.materia]||'compare o conceito principal com as alternativas antes de responder novamente'}.`,fonte:q.fonte||'Banco autoral OMAVEST'};
    }
    if(pathname==='/api/ia/redacao'&&method==='POST'){
      requireUser();
      const text=String(body.texto||'').trim();
      if(text.length<120)throw new Error('Na demonstração, escreva pelo menos 120 caracteres para gerar a análise.');
      const banca=String(body.banca||'ENEM').toUpperCase(),genero=String(body.genero||'Dissertativo-argumentativo');
      let score=620+Math.min(160,Math.floor(text.length/11));
      if(/portanto|assim|dessa forma|desse modo|logo|além disso|ademais/i.test(text))score+=50;
      if(/sociedade|estado|educa|cidad|polít|direit|trabalho|cultura|saúde|tecnologia/i.test(text))score+=40;
      const paragraphs=text.split(/\n\s*\n/).filter(x=>x.trim()).length;if(paragraphs>=4)score+=30;
      score=Math.max(0,Math.min(960,Math.round(score/20)*20));
      let feedback='';
      if(banca==='ENEM') feedback=`Competência I • A linguagem está compreensível. Revise concordância, pontuação e repetições na versão final.

Competência II • O texto permanece relacionado ao tema. Explicite a tese logo na introdução e use repertório produtivo.

Competência III • Há uma linha argumentativa identificável. Fortaleça os parágrafos com causa, consequência, exemplo ou dado pertinente.

Competência IV • Varie conectivos e cuide da progressão entre períodos e parágrafos.

Competência V • Confira se a proposta de intervenção apresenta agente, ação, meio e finalidade, respeitando os direitos humanos.

Feedback demonstrativo do OMAVEST, sem valor oficial.`;
      else if(banca==='UNICAMP') feedback=`Adequação ao gênero • A proposta selecionada exige ${genero}. Verifique se linguagem, interlocutor e finalidade combinam com esse gênero.

Cumprimento da tarefa • Garanta que todas as ações pedidas pela situação comunicativa estejam presentes.

Leitura e argumentação • Use as ideias do tema de forma crítica, sem transformar o texto em uma dissertação genérica.

Articulação escrita • Revise coesão, progressão e escolhas lexicais.

Feedback demonstrativo do OMAVEST, sem valor oficial.`;
      else if(banca==='FUVEST') feedback=`Adequação à proposta • Confirme o gênero escolhido (${genero}) e mantenha a discussão centrada no tema.

Argumentação • Desenvolva uma posição clara e selecione exemplos que realmente sustentem o raciocínio.

Estrutura • Organize introdução, desenvolvimento e fechamento de acordo com o gênero solicitado, evitando fórmulas prontas.

Expressão • Revise clareza, coesão, vocabulário e domínio da norma escrita.

Feedback demonstrativo do OMAVEST, sem valor oficial.`;
      else feedback=`Tema e tese • Responda diretamente ao recorte proposto e mantenha uma posição clara.

Argumentação • Desenvolva argumentos consistentes e relacionados aos textos de apoio.

Coerência e coesão • Garanta progressão entre as ideias e use conectivos com naturalidade.

Expressão escrita • Revise pontuação, concordância e precisão vocabular.

Feedback demonstrativo do OMAVEST, sem valor oficial.`;
      return {success:true,redacaoId:Date.now(),nota:score,notaEstimada:score,escala:1000,feedback,aviso:'Pontuação educacional demonstrativa.',fontes:[{titulo:`Critérios de treino ${banca}`,fonte:'OMAVEST • protótipo local'},{titulo:'Revisão de estrutura e coesão',fonte:'OMAVEST • guia autoral'}]};
    }
    throw new Error('Recurso demonstrativo ainda não disponível: '+pathname);
  }

  async function api(path,options={}){ return demoApi(path,options); }
  async function apiOr(path,fallback){try{return await api(path)}catch(error){console.warn(`Fallback para ${path}:`,error.message);return typeof fallback==='function'?fallback():fallback}}
  function post(path,body){return api(path,{method:'POST',body:JSON.stringify(body)})}
  function put(path,body){return api(path,{method:'PUT',body:JSON.stringify(body)})}
  function patch(path,body={}){return api(path,{method:'PATCH',body:JSON.stringify(body)})}

  function getCommunityPosts(){requireUser();return clone(state.communityPosts||[]);}
  function createCommunityPost(text,category='Geral'){
    requireUser();
    const clean=String(text||'').trim();
    if(clean.length<5) throw new Error('Escreva pelo menos 5 caracteres para publicar.');
    const name=state.user?.displayName||state.profile.nome||'Estudante';
    const post={id:state.nextCommunityPost++,author:name,initial:(name.trim()[0]||'E').toUpperCase(),category:String(category||'Geral'),text:clean,createdAt:'Agora',likes:0,liked:false,comments:[]};
    state.communityPosts.unshift(post);saveState();return clone(post);
  }
  function toggleCommunityLike(id){requireUser();const post=(state.communityPosts||[]).find(p=>p.id===Number(id));if(!post)throw new Error('Publicação não encontrada.');post.liked=!post.liked;post.likes=Math.max(0,Number(post.likes||0)+(post.liked?1:-1));saveState();return clone(post);}
  function addCommunityComment(id,text){requireUser();const clean=String(text||'').trim();if(clean.length<2)throw new Error('Digite um comentário.');const post=(state.communityPosts||[]).find(p=>p.id===Number(id));if(!post)throw new Error('Publicação não encontrada.');post.comments=Array.isArray(post.comments)?post.comments:[];post.comments.push({author:state.user?.displayName||'Estudante',text:clean});saveState();return clone(post);}
  function recordDonation(amount,method='Apoio demonstrativo'){requireUser();const value=Number(amount);if(!Number.isFinite(value)||value<=0)throw new Error('Informe um valor válido.');const donation={id:Date.now(),amount:Number(value.toFixed(2)),method:String(method),createdAt:new Date().toISOString()};state.donations=Array.isArray(state.donations)?state.donations:[];state.donations.unshift(donation);saveState();return clone(donation);}
  function getDonations(){requireUser();return clone(state.donations||[]);}
  function getCommunityLinks(){requireUser();return {discord:'https://discord.gg/kPTPrRhwz',youtube:'https://www.youtube.com/channel/UCjPDSXZSQTCbN0D2bCLgeGg'};}
  function updateCommunityLinks(){requireUser();return {discord:'https://discord.gg/kPTPrRhwz',youtube:'https://www.youtube.com/channel/UCjPDSXZSQTCbN0D2bCLgeGg'};}


  function setExamHandoff(data){
    requireUser();
    state.examHandoff=data?clone(data):null;
    saveState();
    return clone(state.examHandoff);
  }
  function getExamHandoff(){
    requireUser();
    return state.examHandoff?clone(state.examHandoff):null;
  }
  function clearExamHandoff(){
    requireUser();
    state.examHandoff=null;
    saveState();
    return true;
  }

  async function initAuth(){return state.user}
  async function getUser(){return state.user}
  async function getIdToken(){return state.user?'demo-token':null}
  async function login(email,password){
    const e=String(email||'').trim().toLowerCase(),p=String(password||'');
    if(!e||!p) throw new Error('Preencha e-mail e senha.');
    const acc=state.accounts.find(a=>a.email.toLowerCase()===e&&a.password===p);
    if(!acc)throw new Error('E-mail ou senha inválidos. Use demo@omavest.com / 123456 ou crie uma conta.');
    state.user={uid:'demo-'+e,displayName:acc.name,email:acc.email};
    state.profile.nome=acc.name;state.profile.email=acc.email;
    saveState();return state.user;
  }
  async function register(name,email,password){
    const n=String(name||'').trim(),e=String(email||'').trim().toLowerCase(),p=String(password||'');
    if(n.length<2)throw new Error('Digite seu nome.');
    if(!/^\S+@\S+\.\S+$/.test(e))throw new Error('Digite um e-mail válido.');
    if(p.length<6)throw new Error('A senha deve ter pelo menos 6 caracteres.');
    let acc=state.accounts.find(a=>a.email.toLowerCase()===e);
    if(acc)throw new Error('Já existe uma conta demonstrativa com este e-mail.');
    acc={name:n,email:e,password:p};state.accounts.push(acc);
    state.user={uid:'demo-'+e,displayName:n,email:e};state.profile.nome=n;state.profile.email=e;
    saveState();return state.user;
  }
  async function getAccount(){
    requireUser();
    const acc=state.accounts.find(a=>a.email.toLowerCase()===String(state.user.email||'').toLowerCase());
    return {name:acc?.name||state.user.displayName||'',email:acc?.email||state.user.email||'',profile:clone(state.profile)};
  }
  async function updateAccount(payload={}){
    requireUser();
    const n=String(payload.nome??state.user.displayName??'').trim();
    const e=String(payload.email??state.user.email??'').trim().toLowerCase();
    if(n.length<2) throw new Error('Digite um nome com pelo menos 2 caracteres.');
    if(!/^\S+@\S+\.\S+$/.test(e)) throw new Error('Digite um e-mail válido.');
    const current=String(state.user.email||'').toLowerCase();
    if(e!==current && state.accounts.some(a=>a.email.toLowerCase()===e)) throw new Error('Já existe uma conta com este e-mail.');
    const acc=state.accounts.find(a=>a.email.toLowerCase()===current);
    if(acc){acc.name=n;acc.email=e;}
    state.user={uid:'demo-'+e,displayName:n,email:e};
    state.profile=Object.assign({},state.profile,{
      nome:n,email:e,
      vestibularAlvo:String(payload.vestibularAlvo??state.profile.vestibularAlvo??'ENEM').trim()||'ENEM',
      dataVestibular:payload.dataVestibular||state.profile.dataVestibular,
      minutosPorDia:Math.max(15,Math.min(720,Number(payload.minutosPorDia??state.profile.minutosPorDia??120)))
    });
    saveState();
    return getAccount();
  }
  async function changePassword(currentPassword,newPassword){
    requireUser();
    const acc=state.accounts.find(a=>a.email.toLowerCase()===String(state.user.email||'').toLowerCase());
    if(!acc) throw new Error('Conta local não encontrada.');
    if(String(currentPassword||'')!==acc.password) throw new Error('A senha atual está incorreta.');
    const next=String(newPassword||'');
    if(next.length<6) throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    if(next===acc.password) throw new Error('Escolha uma senha diferente da atual.');
    acc.password=next;saveState();return true;
  }
  async function logout(){state.user=null;saveState()}
  function isFirebaseConfigured(){return false}
  function isDemoMode(){return true}
  function resetDemo(){state=defaultState();saveState();location.href='login.html'}

  const items=[['index.html','home','Início'],['cronograma.html','calendar','Cronograma'],['simulados.html','timer','Simulados'],['provas.html','archive','Provas antigas'],['questoes.html','checkCircle','Questões'],['comunidade.html','users','Comunidade'],['redacao.html','pen','Redação'],['vestibulares.html','cap','Vestibulares']];
  function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  async function mountShell(active='index.html'){
    if(!state.user){location.replace('login.html');return}
    const sidebar=document.querySelector('#sidebar'),topbar=document.querySelector('#topbar');if(!sidebar||!topbar)return;
    // Os rótulos somem no menu recolhido; aria-label e title mantêm o nome de cada link para leitores de tela e mouse.
    const navLink=(href,iconName,label,cls='nav-link')=>`<a class="${cls} ${active===href?'active':''}" href="${href}" aria-label="${label}" title="${label}"${active===href?' aria-current="page"':''}><span class="nav-icon">${icon(iconName)}</span><span>${label}</span></a>`;
    sidebar.setAttribute('aria-label','Menu lateral');
    sidebar.innerHTML=`<div class="brand-row"><a href="index.html" class="brand-link" aria-label="OMAVEST - Início"><img src="../assets/logo-omavest-v13.png" alt="OMAVEST"></a></div><nav class="nav-list" aria-label="Menu principal">${items.map(([href,iconName,label])=>navLink(href,iconName,label)).join('')}</nav><nav class="nav-bottom nav-list" aria-label="Menu secundário">${navLink('doacoes.html','heart','Apoiar','donation-nav')}${navLink('configuracoes.html','settings','Configurações')}${navLink('ajuda.html','help','Ajuda')}</nav>`;
    const user=state.user,name=user?.displayName||user?.email?.split('@')[0]||'Estudante',initial=(name.trim()[0]||'E').toUpperCase();
    topbar.innerHTML=`<a class="mobile-brand" href="index.html" aria-label="OMAVEST - Início"><img src="../assets/favicon.png" alt=""></a><div class="topbar-spacer"></div><div class="user-tools"><span class="demo-badge">DEMO</span><button class="theme-toggle" data-theme-toggle type="button" aria-label="Alternar tema"></button><a class="user-profile-link" href="perfil.html" title="Abrir perfil" aria-label="Abrir perfil de ${escapeHtml(name)}"><span class="avatar" aria-hidden="true">${initial}</span><span class="user-name">${escapeHtml(name)}</span></a></div>`;
    document.querySelector('[data-theme-toggle]')?.addEventListener('click',()=>toggleTheme());
    refreshThemeControls();
  }
  function toast(message){const old=document.querySelector('.toast');old?.remove();const el=document.createElement('div');el.className='toast';el.textContent=message;document.body.appendChild(el);announce(message);setTimeout(()=>el.remove(),3600)}
  // Região "ao vivo" fixa: leitores de tela anunciam avisos e resultados sem roubar o foco.
  function announce(message){
    let live=document.querySelector('#srLive');
    if(!live){live=document.createElement('div');live.id='srLive';live.className='sr-only';live.setAttribute('role','status');live.setAttribute('aria-live','polite');document.body.appendChild(live);}
    live.textContent='';setTimeout(()=>{live.textContent=message},60);
  }
  window.OMAVEST={api,apiOr,post,put,patch,initAuth,getUser,getIdToken,login,register,getAccount,updateAccount,changePassword,logout,isFirebaseConfigured,isDemoMode,resetDemo,mountShell,toast,announce,escapeHtml,icon,getTheme:()=>currentTheme,setTheme,toggleTheme,refreshThemeControls,getCommunityPosts,createCommunityPost,toggleCommunityLike,addCommunityComment,getCommunityLinks,updateCommunityLinks,recordDonation,getDonations,setExamHandoff,getExamHandoff,clearExamHandoff,_state:()=>state};
})();
