# Pontos para atualizar no texto do TCC antes da banca

A plataforma agora possui recursos que vão além dos objetivos específicos atuais do documento. Se o grupo decidir demonstrá-los como parte oficial da entrega, vale incluir explicitamente:

- banco de questões e simulados por vestibular/matéria;
- acompanhamento de desempenho e progresso;
- prática de redação com feedback assistido por IA, deixando claro que a nota é estimativa educacional;
- Firebase Authentication como autenticação da plataforma;
- fluxo técnico do RAG: indexação, chunking, embeddings, recuperação por similaridade, top-k, contexto e LLM;
- exibição das fontes recuperadas pela IA.

## Ajuste de linguagem recomendado para redação

Evitar frases como “IA treinada nos critérios oficiais do INEP” se não houve treinamento/fine-tuning específico e documentado. Uma formulação tecnicamente mais correta é:

> A plataforma utiliza inteligência artificial configurada para fornecer feedback educacional de redações com base em critérios de avaliação fornecidos no contexto do sistema. A pontuação apresentada é uma estimativa de estudo e não substitui a correção oficial.

## Escopo removido

Não descrever o OMAVEST como instituição aplicadora de vestibular. Fluxos de boleto, matrícula, local de prova e resultado de processo seletivo foram retirados da nova arquitetura porque o objetivo da plataforma é apoiar a preparação do estudante.
