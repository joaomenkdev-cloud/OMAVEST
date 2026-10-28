# Questões em formato de print

Cada arquivo desta pasta é o recorte (print) de uma questão oficial. As questões atuais são do ENEM 2023, 1º e 2º dias (Caderno Azul), publicadas pelo INEP.

## Como adicionar uma nova questão

1. Faça o print só da questão (enunciado + alternativas, sem o título "QUESTÃO XX"). No Windows, use `Win + Shift + S`.
2. Salve o arquivo em PNG nesta pasta, por exemplo `fuvest-2025-q012.png`.
3. Em `pc/js/demo-core.js`, dentro da lista `questions`, adicione uma linha como esta (use um `id` que ainda não exista):

```js
{id:44,vestibular:'FUVEST',materia:'História',tema:'Brasil Colônia',ano:2025,dificuldade:'media',
 origem:'oficial',numeroOriginal:12,caderno:'1ª fase • Versão V',
 imagem:'../assets/questoes/fuvest-2025-q012.png',largura:700,altura:560,
 enunciado:'Texto do enunciado (usado na opção "Ler questão em texto" e no histórico)',
 alternativas:{A:'...',B:'...',C:'...',D:'...',E:'...'},
 resposta:'C',explicacao:'Por que a alternativa C está correta.',fonte:'FUVEST 2025 • 1ª fase, questão 12'},
```

- `largura` e `altura` são o tamanho da imagem em pixels. Eles evitam que a página "pule" enquanto o print carrega.
- Mesmo com a imagem, preencha `enunciado` e `alternativas` em texto: é isso que os leitores de tela leem.
- Os filtros (Vestibular, Matéria e Ano) passam a mostrar os novos valores automaticamente.

Para recortar muitas questões do ENEM de uma vez, use o script `docs/ferramentas/recortar_questoes_enem.py`.
