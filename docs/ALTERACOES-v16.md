# Alterações v16

## Acessibilidade
- Novo botão de **Acessibilidade** no topo de todas as páginas (inclusive no login) e um cartão com as mesmas opções em **Configurações**:
  - tamanho do texto (100%, 115%, 130% e 150%);
  - alto contraste (modo claro e escuro);
  - leitura facilitada (fonte mais legível e mais espaçamento);
  - destacar links e botões;
  - reduzir animações;
  - Libras com o **VLibras** (widget oficial do Governo Federal; precisa de internet e só é carregado quando a opção é ligada).
- As preferências ficam salvas no navegador e são aplicadas antes da página aparecer, sem "piscar".
- Link "Pular para o conteúdo" (primeira tecla Tab de cada página).
- Menu com `aria-label` e `aria-current`: os itens continuam com nome mesmo quando o menu está recolhido.
- Abas de Questões no padrão ARIA (setas ← → alternam entre Praticar, Histórico e Desempenho).
- Correções e avisos são anunciados por leitores de tela, e o resultado nunca depende só da cor (há ícone e texto "Acertou/Errou").
- Contraste do texto amarelo corrigido no modo claro e contorno de foco mais visível.

## Flashcards
- Removidos do menu, das páginas e do CSS. `flashcards.html` agora redireciona para Questões (mesmo padrão usado em `universidades.html`).
- Registrados como sugestão para trabalhos futuros em `SUGESTOES_TCC.md`.

## Questões em formato de print
- 18 questões **oficiais do ENEM 2023** (INEP), recortadas do caderno de prova, com gabarito oficial, em `pc/assets/questoes/`.
- Cobrem Português, História, Geografia, Filosofia, Biologia, Química, Física e Matemática.
- A imagem pode ser ampliada (botão "Ampliar" ou clique no print), e cada questão tem a opção **"Ler questão em texto"** para leitores de tela.
- As alternativas das questões em print aparecem como botões A–E.
- As questões oficiais aparecem primeiro e recebem a etiqueta "Prova oficial"; as autorais continuam no banco com a etiqueta "Autoral".
- Os simulados também exibem os prints.
- Como adicionar mais: veja `pc/assets/questoes/LEIA-ME.md`.

## Correção em vermelho
- Questão errada: o cartão inteiro fica vermelho (borda, faixa lateral e fundo), com o selo "Errou".
- A alternativa marcada fica vermelha e a correta fica verde.
- A lateral "Correção da sessão" mostra acertos e erros e um mapa numerado: as questões erradas aparecem em vermelho e, ao clicar, a página vai até a questão.
- Simulado: ao finalizar, aparece a **correção completa da prova**, com as questões erradas ou em branco em vermelho.
- Histórico: as respostas erradas também ficam destacadas em vermelho.

## Filtros de Questões
- Os filtros foram reduzidos de 8 para 3: **Vestibular, Matéria e Ano**, em uma única linha.
- O resultado se atualiza automaticamente, sem botão "Aplicar".
- As questões aparecem de 10 em 10, com o botão "Carregar mais".
- Também foi corrigido um defeito: `.filter-grid` não tinha `display:grid`, por isso os filtros ficavam todos empilhados.
