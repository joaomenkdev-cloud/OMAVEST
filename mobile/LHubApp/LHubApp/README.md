# OMAVEST — App mobile (Expo / React Native, SDK 51)

Versão celular do site: mesmo visual (Playfair + Source Serif, verde e amarelo), mesmas seções e mesmo menu — Início, Inscrições, Notícias, Provas, Cronograma, Simulado, Redação e Minha Área (login, cadastro, painel com progresso de estudos). Consome a API do servidor OMAVEST (`pc/backend`) e os dados em `pc/data/*.json` (banco de simulados, temas de redação, notícias e provas), então o conteúdo é o mesmo do site. Funciona offline com cache dos últimos dados.

## Rodar
Deixe o servidor ligado (`INICIAR-OMAVEST.bat`) e use `INICIAR-APP-MOBILE.bat`, ou:

```bash
npm install
npm run web        # navegador, formato celular (http://localhost:8081)
npm run android    # emulador/celular Android (precisa do Android Studio)
```
Login: **Entrar com a conta demo** (`demo@omavest.com` / `123456`) ou e-mail/nº de inscrição.

## Endereço do servidor
Automático: o app usa o mesmo IP do computador que serve o Expo (porta 5000). Para mudar:
tela de login → rodapé **Servidor** → digite o IP (ex.: `192.168.0.15`). Também aceita `EXPO_PUBLIC_API_URL` ou `extra.apiUrl` no `app.json`.
Android em emulador usa `10.0.2.2` automaticamente. O tráfego HTTP local está liberado (`usesCleartextTraffic`).

## Observações
- SDK 51: o app da loja *Expo Go* só abre o SDK mais recente — use `npm run web` ou `npm run android` (build de desenvolvimento).
- O pacote Android continua `br.com.lhub.vestibular` (a pasta `android/` foi gerada com ele); o nome exibido é **OMAVEST**.
- Pasta `backend/` aqui dentro é a API Node/Supabase antiga (legada, não usada pelo app atual).
