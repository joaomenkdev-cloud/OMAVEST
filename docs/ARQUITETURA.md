# Arquitetura OMAVEST 2.0

```text
Navegador
  │
  ├── HTML/CSS/JavaScript
  │      └── Firebase Authentication → ID Token
  │
  ▼
ASP.NET Core API (C#)
  │
  ├── Firebase Admin → valida ID Token
  ├── Entity Framework Core
  │      └── SQLite
  │
  ├── Acervo
  │      Disciplina → Tema → Conteúdo
  │
  ├── Aprendizagem
  │      Progresso → Trilha → Cronograma
  │
  ├── Avaliação
  │      Questões → Simulado → Redação
  │
  └── RAG
         Conteúdo/PDF
             ↓
         chunking
             ↓
         embeddings
             ↓
         RagTrecho (SQLite)
             ↓
         similaridade cosseno
             ↓
         top-k fontes
             ↓
         LLM
             ↓
         resposta + fontes
```

## Por que SQLite?

O TCC exige banco relacional, mas não fixa SGBD. SQLite deixa a apresentação local simples e mantém o modelo relacional. Se o projeto for publicado para muitos usuários, a camada EF Core permite migrar depois para PostgreSQL com mudanças controladas.

## Autenticação

A versão anterior possuía dois caminhos de autenticação. A nova versão define Firebase como fonte única de identidade. O backend não armazena senha. Ele recebe `Authorization: Bearer <Firebase ID Token>` e valida o token no servidor.

## RAG

A recuperação não consulta o modelo antes de buscar fontes. A pergunta é convertida em embedding, comparada com os embeddings dos trechos do acervo e somente os trechos mais próximos entram no contexto enviado ao LLM. O endpoint retorna também a lista de fontes recuperadas.
