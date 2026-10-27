# Relatório de QA — OMAVEST (site + app)

- **Data da verificação:** 21–22/10/2026
- **Ambiente:** local (Windows 11) — API/site em `http://localhost:5000`, app via Expo Web em `http://localhost:8081`
- **Ferramentas:** .NET SDK 10.0.103, Node 24.16, Expo SDK 51.0.39, Playwright (Chromium headless)
- **Contas usadas:** conta demo (`demo@omavest.com`) e contas descartáveis `teste+…@omavest.test` criadas no SQLite local. O banco foi restaurado do backup ao final.
- **Scripts de teste:** `tests/` (veja `tests/README.md`)

> Este relatório não contém valores de chaves nem dados pessoais reais. Os dados de inscrição usados nos testes eram fictícios.

## Resumo geral

**Funciona:**
- Os 3 projetos compilam e rodam. O backend teve 0 erros e 3 avisos. O app (Expo SDK 51) rodou no Node 24 em modo web e gerou o build de produção web sem erros.
- Nenhum dos 3 projetos tem testes automatizados.
- Cadastro, login (por e-mail ou nº de inscrição), logout com revogação do token, troca de senha, validações de formulário (válido, inválido e vazio), simulado com cronômetro e finalização automática, "Entender por que errei", correção de redação, filtros e buscas funcionam nos dois.
- Nenhum erro de console, link quebrado ou imagem quebrada. O site não transborda na horizontal em 320, 375, 768 e 1440 px.
- HTML digitado no nome não é executado.
- As APIs respondem em 2 a 4 ms.
- Banco de questões, temas de redação e links das provas são **idênticos** no site e no app. A mesma redação recebeu a mesma nota nos dois.

**Não funciona:** rotas da API sem login que expõem dados pessoais e alteram pagamento e questões; o simulado repete questões e entrega quantidades diferentes no site e no app; o progresso não sincroniza; não existe recuperação de senha; no app, Simulados e Redação ficam vazios se forem abertos com o servidor fora do ar e não se recuperam.

## Achados preliminares (confirmação em execução)

| # | Achado | Resultado |
|---|---|---|
| 1 | `/api/admin/questoes` sem proteção | **Confirmado.** Pelo IP da rede, a importação devolve 403, mas essa rota devolve 200. PUT, DELETE e POST chegam à lógica de negócio (testado com ID inexistente, sem alterar dados). |
| 2 | `POST /api/pagamento/confirmar` sem login | **Confirmado.** Uma inscrição de teste foi para `confirmado`/`inscrito` sem token. |
| 3 | Dados pessoais expostos | **Confirmado.** Sem token **e com token inválido**, a rota devolve CPF, RG, nome da mãe e endereço. `OM-DEMO` tem número previsível. |
| 4 | `mobile/.env` | **Existe com as chaves, mas não é usado.** Os nomes só aparecem no backend Node legado. Os valores não aparecem em nenhum outro arquivo (41.496 arquivos, incluindo `node_modules` e `android/`), `.zip`, histórico git (o `.env` nunca foi commitado), bundle do app, build web nem nos arquivos do site. O `JWT_SECRET` tem só 8 caracteres. |
| 5 | IA aberta | **Confirmado em parte.** 40 de 40 chamadas sem login deram 200, sem limite, com texto livre. O custo na Groq não foi medido (sem chave). |
| 6 | Progresso não sincroniza | **Confirmado.** Simulado feito no site não aparece no app com a mesma conta, e vice-versa. |

## Tabela de problemas

| # | Problema | Onde | Como reproduzir | Gravidade | Correção sugerida |
|---|---|---|---|---|---|
| 1 | Dados pessoais da inscrição expostos sem login | Ambos (API) | `GET /api/inscricao/OM-DEMO` sem token | **Crítico** | Exigir token do dono ou remover (nenhuma tela usa). |
| 2 | Qualquer pessoa confirma pagamento | Ambos (API) | `POST /api/pagamento/confirmar {"NumeroInscricao":"..."}` | **Crítico** | Remover ou restringir a admin ou webhook do gateway. |
| 3 | Admin de questões aberto para a rede | Ambos (API) | De outro PC: `PUT /api/admin/questoes/{id}` | Alto | `[LocalOnly]` ou autenticação de admin, ou remover. |
| 4 | Simulado repete questões | Site | Simulados → Biologia: 21 questões, só 7 distintas | Alto | Sortear só questões distintas ou aumentar o banco. |
| 5 | Nível "Fácil" sem questões em 5 de 8 matérias | Ambos | Fácil + Matemática → aviso | Médio | Cadastrar questões ou esconder o nível vazio. |
| 6 | Simulados e Redação vazios até reabrir o app | App | Abrir com o servidor desligado → "0 questões"; ligar o servidor → continua vazio | Alto | Recarregar ao focar a tela ou "Tentar de novo"; mensagem de "sem conexão". |
| 7 | Progresso local, não sincroniza | Ambos | Achado 6 | Alto | Endpoints de simulados (a tabela `SimuladosRealizados` já existe). |
| 8 | Sem recuperação de senha | Ambos | "Esqueci a senha" só mostra um aviso | Alto | Redefinição por e-mail com token, ou pelo menos pelo admin. |
| 9 | Login sem limite de tentativas | Ambos (API) | 30 senhas erradas seguidas, depois a certa entra | Médio | RateLimiter do ASP.NET Core e bloqueio temporário. |
| 10 | IA sem login e sem limite | Ambos (API) | Achado 5 | Médio | Token, limite de taxa e prompt montado no servidor. |
| 11 | Trocar a senha não derruba outras sessões | Ambos | Token de outra sessão continua dando 200 | Médio | Revogar os tokens do usuário. |
| 12 | Chave service role do Supabase em texto puro | Repositório | `mobile/.env` | Médio | Rotacionar no Supabase e apagar o arquivo. |
| 13 | `/api/inscricao` sem validação | Ambos (API) | Aceitou CPF `abc`, e-mail `nao-e-email`, UF `SPX`; e-mail em MAIÚSCULAS criou conta duplicada; senha temporária volta na resposta | Médio | Validar e normalizar, ou remover. |
| 14 | Pacote com vulnerabilidade alta | Backend | SQLitePCLRaw 2.1.10 (via EF Core 9.0.0) | Médio | Atualizar `Microsoft.EntityFrameworkCore.Sqlite`. |
| 15 | Servidor publica arquivos internos | Site | `/backend/obj/project.assets.json` (caminhos locais e nome de usuário do Windows), `/README.md`, `/firebase.json`, 7 imagens não usadas (uma de 1,8 MB) | Médio | Servir só a pasta pública. |
| 16 | Cards prometem números diferentes do simulado | Ambos | Biologia: card 35 q/65 min, página 40 q/70 min, site entrega 21, app entrega 7 | Médio | Uma configuração única. |
| 17 | Status do cronograma fixo no HTML | Site | A partir de 28/11/2026 continuará dizendo "Em andamento" | Médio | Ler de `/api/cronograma`. |
| 18 | Termos e Privacidade não existem no app, mas o cadastro exige aceitá-los | App | Links do cadastro não abrem nada | Médio | Telas ou links para o site. |
| 19 | HTTP sem criptografia (`usesCleartextTraffic`) | Ambos | Senha e token trafegam abertos no Wi-Fi | Médio (se publicar) | HTTPS. |
| 20 | Notícias desatualizadas; JSON sem acentos | Ambos | Página Notícias | Baixo | Atualizar o conteúdo. |
| 21 | Notícia "Baixar provas" não faz nada | App | Link fixo em `localhost` | Baixo | Navegar para Provas. |
| 22 | Busca de notícias não ignora acento | Site | "inscricoes" retorna 0 | Baixo | Remover acentos na comparação. |
| 23 | Mensagem técnica "Failed to fetch" | Site | IA com o servidor fora do ar | Baixo | Mensagem amigável. |
| 24 | Nome antigo aparece com sessão expirada | Site | Token inválido → cabeçalho mostra o nome salvo | Baixo | Validar a sessão ou limpar o nome salvo. |
| 25 | Voltar do navegador sai do app | App (web) | Início → Notícias → Voltar = `about:blank` | Baixo | `linking` no React Navigation. |
| 26 | Sem cabeçalhos de segurança; CORS `*`; Swagger público; `/health` mostra nº de tokens | Ambos (API) | `curl -I` | Baixo | Cabeçalhos, origens restritas, Swagger só em dev. |
| 27 | Dá para descobrir quais e-mails têm conta | Ambos (API) | Cadastro diz "já cadastrado"; login responde em 4 ms × 14 ms | Baixo | Mensagem genérica e tempo constante. |
| 28 | Tokens nunca são apagados (1 por login) | API | `/api/health` | Baixo | Limpeza periódica. |
| 29 | Acessibilidade | Ambos | Botões do app sem papel de "botão"; alvos de toque menores que 24 px no site | Baixo | `accessibilityRole` e áreas maiores. |
| 30 | Primeiro carregamento lento; sem compressão; log de cada SQL | Ambos | 3 a 4 s pelas CDNs | Baixo | gzip/br, menos fontes, log do EF em Warning. |
| 31 | Avisos de build e de runtime | Ambos | CS9113 (2×); avisos do RN-web | Baixo | Limpeza. |
| 32 | Data do local de prova fixa no código | App | Painel | Baixo | Ler do cronograma. |

## Divergências entre site e app

- **Progresso:** cada um guarda o seu.
- **Simulado:** o site repete questões (Biologia 21); o app usa só as distintas (Biologia 7).
- **Notícias:** o site tem 9 fixas; o app mostra 13 (4 da API + 9 do JSON, sem acentos).
- **Cronograma:** o site tem status fixos; o app calcula.
- **Páginas só no site:** FAQ, Sobre, Privacidade e Termos.
- **Busca de notícias:** o app ignora acentos, o site não.
- **Erros da IA:** o site mostra mensagem técnica; o app, amigável.
- **Local de prova:** o site lê da API; no app a data é fixa.

**Iguais nos dois:** banco de questões, temas e cartilhas de redação, links das provas, datas do cronograma, contagem regressiva, regras de cadastro, mensagens de login e nota da redação.

## O que não foi possível testar

- **App nativo (Android/iOS):** teclado, botão voltar físico e NetInfo nativo. Testei só no Expo Web. Existe um emulador Android no PC, mas não foi usado porque o build nativo grava GBs de artefatos dentro do projeto.
- **Aviso "Sem conexão" ao reconectar:** inconclusivo no navegador emulado.
- **IA real (Groq):** sem chave configurada.
- **Firebase** (Google, 2FA, recuperação por e-mail): não configurado.
- **Pagamento real:** só existe o boleto simulado.
- **iPhone:** não há Mac.
- **Rede real:** só testei em localhost.

## Prioridade de correção

1. Rotas sem proteção (itens 1, 2, 3, 13).
2. Rotacionar a chave do Supabase e apagar `mobile/.env`.
3. Simulado (itens 4, 5, 16).
4. App recarregar Simulados e Redação (item 6).
5. Sincronizar o progresso (item 7).
6. Recuperação de senha (item 8).
7. Limites e sessões (itens 9 a 11).
8. Pacote vulnerável e pasta pública (itens 14, 15).
9. Fontes únicas para cronograma e notícias; Termos no app (itens 17, 18, 20, 21).
10. Itens baixos.

## Lista de verificação manual (celular)

O projeto usa o SDK 51. O Expo Go da loja só abre o SDK mais recente. No **Android**, instale o Expo Go do SDK 51 pela página expo.dev/go. No **iPhone** não dá: use o modo W (navegador) ou um build de desenvolvimento.

**Preparação**
- [ ] PC e celular no mesmo Wi-Fi.
- [ ] `INICIAR-OMAVEST.bat` aberto.
- [ ] Use o IP do Wi-Fi (192.168.x.x), não o `172.x.x.x` (adaptador virtual).
- [ ] Rode `npx expo start` e leia o QR code.

**Teclado**
- [ ] Login e cadastro: os campos de baixo continuam visíveis com o teclado aberto.
- [ ] Minha Área → Segurança: os 3 campos de senha não ficam escondidos.
- [ ] Redação: dá para ver o texto enquanto digita.
- [ ] "Enter" na senha faz o login.

**Botão voltar (Android)**
- [ ] Em Notícias e em Provas, ver para onde volta (o esperado pelo código é ir para Início).
- [ ] No meio de um simulado, voltar e retornar: o cronômetro e as respostas continuam?
- [ ] Na Redação com texto, voltar e retornar: o texto foi perdido?
- [ ] Voltar no Início fecha o app sem travar.

**Telas pequenas** (de preferência num aparelho com 5" ou menos)
- [ ] Cards de simulado em 2 colunas não cortam texto.
- [ ] A barra inferior não cobre "Finalizar simulado".
- [ ] Cronômetro e título do simulado cabem no cabeçalho.
- [ ] O menu ☰ abre e todos os itens são clicáveis.

**Sem internet**
- [ ] Modo avião com o app aberto: aparece "Sem conexão"?
- [ ] O aviso some ao reconectar?
- [ ] Cronograma e Notícias mostram os dados salvos.
- [ ] Um simulado já aberto antes funciona offline.
- [ ] Abrir o app já offline e entrar em Simulados: o bug do item 6 se repete?
- [ ] Desligar só o servidor: o login mostra a mensagem com o IP do servidor.

**Estados de carregamento**
- [ ] Indicadores em listas, login e correção de redação.
- [ ] Puxar para atualizar em Notícias, Provas e Cronograma.

## Histórico de correções

| Lote | Itens | Status |
|---|---|---|
| 1 | 1, 2, 3, 13 (rotas sem proteção) | **concluído**: rotas removidas (nenhuma tela as usava): `/api/inscricao` (GET/POST), `/api/pagamento/confirmar`, `/api/boleto/{n}`, `/api/candidato/comprovante/{n}`, `/api/local-prova/{n}`, `/api/resultado/{n}` e `/api/admin/questoes/*`. Continuam: importação de PDF (só no próprio PC), `/api/questoes` e `/api/candidato/dashboard` (exige login). |
| 2 | 4, 5, 16 (simulado) | **concluído**: configuração única em `pc/data/simulado-config.json`, lida pelo site (`pc/js/simulados-config.js`) e pelo app (`src/data.js`). Regra única: questões = mín(limite, questões do banco no nível), sem repetição. Nível sem questões deixa o card "Indisponível". Saíram as cópias (banco embutido na página Simulados, `CONFIG_PADRAO`, `SIMULADOS_CARDS`, `CATEGORIAS_SIMULADO`). Ficam para decisão de conteúdo: o tempo não diminui com menos questões (ex.: Biologia 7 questões / 70 min) e o selo "Fácil" de Português, que não tem questões fáceis. |
| 3 | 6 (app recarregar Simulados/Redação) | pendente |
