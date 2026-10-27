# OMAVEST — Site + API

ASP.NET Core (.NET 10) + SQLite servindo o site estático (`html/`, `css/`, `js/`, `assets/`) e a API REST na mesma porta.

## Rodar

```bash
cd pc/backend
dotnet run
```
Site: http://localhost:5000 · API/Swagger: http://localhost:5000/swagger · Banco: `pc/backend/omavest.db` (criado e populado automaticamente; apague o arquivo para resetar).
Ou use `INICIAR-OMAVEST.bat` na raiz do projeto.

## Contas
- **Demo:** `demo@omavest.com` / `123456` (também funciona com o nº de inscrição `OM-DEMO`).
- Qualquer pessoa pode criar conta em *Criar Conta* (e-mail + senha ≥ 8 caracteres); as contas ficam no SQLite (senha com PBKDF2).
- **Firebase é opcional.** Sem configuração o site usa as contas locais. Para ter login com Google e 2FA, copie `js/firebase-config.example.js` sobre `js/firebase-config.js` e preencha as credenciais — o site detecta e passa a usar o Firebase.

## IA (explicação de questões e correção de redação)
Chamadas passam pelo servidor (`/api/ia/explicacao`, `/api/ia/redacao`). Com a variável `GROQ_API_KEY` usa a Groq Cloud; sem ela (ou sem internet) responde em **modo local**, indicado na tela.

```powershell
$env:GROQ_API_KEY="sua_chave"; dotnet run
```

## Ciclo do vestibular na demonstração
Datas do cronograma ficam no banco (`DbSeeder.cs`): inscrições 14/09–27/11/2026, prova 14/02/2027. Contagem regressiva e dashboard leem dessa tabela.

## Endpoints principais
`POST /api/auth/registrar|login|logout|trocar-senha` · `GET /api/auth/perfil` · `GET /api/noticias` · `GET /api/provas` · `GET /api/cronograma` · `GET /api/questoes` · `GET /api/candidato/dashboard` · `POST /api/ia/explicacao|redacao`.
Rotas `/api/admin/importacao/*` (importar provas de PDF) só aceitam requisições do próprio computador.
