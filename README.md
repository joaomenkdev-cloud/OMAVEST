# OMAVEST — Plataforma de Vestibulares (TCC ETEC)

Plataforma de preparação e gestão de processo seletivo (ENEM, FUVEST, UNICAMP): site com simulados, redação com correção por IA, provas anteriores, cronograma, notícias e área do candidato — mais o app mobile.

| Pasta | O que é |
|---|---|
| `pc/` | Site + API (ASP.NET Core .NET 10 + SQLite). O servidor entrega o site e a API juntos. |
| `mobile/LHubApp/LHubApp/` | App mobile OMAVEST (React Native / Expo). |
| `apresentacao-tcc/` | Slides do TCC (`OMAVEST-TCC.pptx`, gerado por `node build.js`). |

## Rodar em 1 clique (Windows)

1. **`INICIAR-OMAVEST.bat`** — sobe o servidor e abre o site em http://localhost:5000
   (precisa do [.NET 10 SDK](https://dotnet.microsoft.com/download); o banco é criado sozinho).
2. **`INICIAR-APP-MOBILE.bat`** — escolha **W** para ver o app no navegador em formato de celular
   (precisa do [Node.js](https://nodejs.org)); **A** para rodar no Android.

**Conta de demonstração:** `demo@omavest.com` / `123456` (site e app).

## Checklist para apresentar

- [ ] Rode `INICIAR-OMAVEST.bat` **antes** e deixe a janela aberta.
- [ ] Site: na página inicial clique em **Entrar na conta demo** (card "Progresso de Estudos") → Simulados (faça e finalize um: o progresso sobe) → "Entender por que errei" → Redação → **Minha Área** (progresso + histórico; link "Reiniciar demonstração" volta tudo ao início).
- [ ] App: `INICIAR-APP-MOBILE.bat` → W → botão **Entrar com a conta demo**.
- [ ] Celular real: PC e celular no mesmo Wi-Fi; no app, rodapé do login → *Servidor* → IP mostrado na janela do servidor. (Se o Windows perguntar sobre o Firewall, permita a rede **privada**.)
- [ ] IA: funciona sem chave (modo offline). Para IA real defina `GROQ_API_KEY` antes de abrir o servidor.

Detalhes técnicos: [`pc/README.md`](pc/README.md) e [`mobile/LHubApp/LHubApp/README.md`](mobile/LHubApp/LHubApp/README.md).
