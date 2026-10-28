# Avaliação do TCC para a versão offline

A versão offline continua coerente com o objetivo educacional do OMAVEST, mas exige ajustes metodológicos se for a versão efetivamente apresentada como implementação final.

## Manter
- HTML, CSS e JavaScript no front-end.
- Acervo digital, organização por disciplinas/temas, trilhas e cronograma.
- Questões, simulados e redação como funcionalidades complementares, desde que incluídas nos objetivos do texto.

## Ajustar no documento
1. O texto atual afirma que o back-end foi desenvolvido em C# e que existe banco relacional/Firebase. Se a banca avaliar a edição offline como produto principal, a metodologia deve dizer que o protótipo funcional usa JavaScript e Web Storage/localStorage para persistência local, enquanto C#/banco/Firebase ficam como arquitetura de evolução online.
2. Não chamar a correção objetiva de IA: ela é correção automática por gabarito.
3. A versão offline não executa um LLM. O tutor local faz recuperação de conteúdo e resposta demonstrativa. Portanto, o texto deve apresentar RAG completo como arquitetura/prova de conceito de evolução, ou manter o backend RAG como módulo separado e demonstrável quando houver ambiente servidor.
4. Se Simulados, Banco de Questões, Comunidade e Redação forem apresentados como partes centrais, acrescentá-los aos objetivos específicos e à metodologia.
5. Descrever a persistência local e a característica de protótipo offline como decisão para portabilidade e demonstração sem dependência de infraestrutura.
