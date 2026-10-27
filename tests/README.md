# Testes do OMAVEST

Testes automáticos do site, do app (via Expo Web) e da API. Eles acompanham o `RELATORIO-QA.md` da raiz.

## Pré-requisitos
- .NET 10 SDK e Node.js (os mesmos do projeto).
- Python 3.10+ com Playwright:
  ```bash
  pip install playwright
  python -m playwright install chromium
  ```

## Como rodar
Na pasta `L-hub`:
```bash
python tests/run_tests.py                # tudo (cerca de 6 a 10 minutos)
python tests/run_tests.py api            # só a API (rápido)
python tests/run_tests.py site app       # só os fluxos do site e do app
```

**Deixe o servidor desligado antes de rodar.** Assim o executor:
1. faz backup de `pc/backend/omavest.db*`;
2. sobe o servidor e, se precisar, o Expo Web;
3. roda os testes;
4. desliga tudo e restaura o banco.

Os testes criam contas `teste+…@omavest.test`. Se o servidor já estiver aberto, os testes usam esse servidor e **o banco não é restaurado**.

## Suítes
| Suíte | Arquivo | O que verifica |
|---|---|---|
| `dados` | `compare_data.js` | Banco de questões, configuração e temas de redação iguais no site e no app |
| `segredos` | `scan_segredos.js` | Valores de `mobile/.env` não aparecem em nenhum outro arquivo (não imprime os valores) |
| `api` | `api_checks.py` | Rotas sem proteção, acesso pela rede local, autenticação, conteúdo e IA |
| `crawl` | `site_crawl.py` | 12 páginas × 4 tamanhos de tela: console, rede, imagens, transbordo, links |
| `site` | `site_flows.py` | Cadastro, login, senha, simulado, redação, notícias, provas, servidor fora do ar |
| `app` | `app_flows.py` | Os mesmos fluxos no app, progresso site × app, offline, servidor fora do ar, tamanhos de tela |

## Como ler o resultado
- `OK`: passou.
- `CONHECIDA (item N)`: falhou, mas é o problema N já registrado no `RELATORIO-QA.md`.
- `OK (item N resolvido)`: o problema N foi corrigido. Dá para tirar a marcação `conhecido=` do teste.
- `FALHA`: problema novo ou regressão. O script termina com código 1.

Capturas de tela e JSON ficam em `tests/_saida/<suite>/`.

## Limitações
- O app é testado no navegador (react-native-web), não em Android/iOS nativo. Para o celular, use a lista manual do `RELATORIO-QA.md`.
- O aviso "Sem conexão" ao reconectar é inconclusivo no navegador. No web, a biblioteca NetInfo só escuta `navigator.connection`.
