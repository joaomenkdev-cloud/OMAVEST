"""Fluxos ponta a ponta do site (cadastro, login, senha, simulado, redação, notícias, provas, erros).

Cria contas de teste teste+site<hora>@omavest.test. Use via run_tests.py para restaurar o banco depois.
Grava <saida>/site_account.json (usado por app_flows.py para comparar o progresso entre site e app).
"""
import json
import re
import sys
import time

from playwright.sync_api import sync_playwright

from _comum import SITE, Relatorio, esperado_simulados

R = Relatorio('site_flows', sys.argv[1] if len(sys.argv) > 1 else None)
H = f'{SITE}/html/'
RUN = time.strftime('%H%M%S')
EMAIL = f'teste+site{RUN}@omavest.test'
SENHA, NOVA = 'Senha@1234', 'Nova@12345'
TEXTO_REDACAO = (
    'A valorização da herança africana no Brasil enfrenta obstáculos históricos. Segundo dados do IBGE, a maioria da população '
    'se declara negra ou parda, contudo o racismo estrutural persiste. ' * 2
    + '\n\nAlém disso, a escola ainda trata a cultura afro-brasileira de forma superficial, embora a Lei 10.639 torne obrigatório o '
    'ensino de história africana. Dessa forma, o problema se perpetua.\n\nPortanto, cabe ao Ministério da Educação, por meio de '
    'formação continuada de professores, garantir a aplicação da lei, a fim de valorizar a contribuição africana na formação nacional.')
step = R.step


HTTP_ERROS = []          # respostas 404/5xx recebidas pelas páginas (ex.: rota removida que ainda é chamada)
ESPERADOS = re.compile(r'status of (401|409) ')   # o próprio teste provoca: senha errada (401) e e-mail repetido (409)


def nova_pagina(ctx, dialogs, cons):
    pg = ctx.new_page()
    pg.on('dialog', lambda d: (dialogs.append(f'{d.type}: {d.message[:150]}'), d.accept()))
    pg.on('console', lambda m: cons.append(m.text[:200]) if m.type == 'error' and not ESPERADOS.search(m.text) else None)
    pg.on('pageerror', lambda e: cons.append('pageerror ' + str(e)[:200]))
    pg.on('response', lambda r: HTTP_ERROS.append(f'{r.status} {r.request.method} {r.url[:100]}') if r.status == 404 or r.status >= 500 else None)
    return pg


def vis(pg, sel):
    return pg.locator(sel).first.is_visible()


def progresso(pg, numero):
    return pg.evaluate(f"JSON.parse(localStorage.getItem('omavest_progress_{numero}') || 'null')")


with sync_playwright() as p:
    br = p.chromium.launch(headless=True)
    ctx = br.new_context(viewport={'width': 1280, 'height': 900})
    dialogs, cons = [], []
    pg = nova_pagina(ctx, dialogs, cons)

    # ── CADASTRO ───────────────────────────────────────────
    pg.goto(H + 'inscricao.html'); pg.wait_for_load_state('networkidle')
    pg.click('#regForm button[type=submit]')
    errs = [e for e in ['erNome', 'erSobrenome', 'erEmail', 'erSenha', 'erTermos'] if vis(pg, '#' + e)]
    step('Cadastro', 'enviar vazio mostra erros', len(errs) == 5, errs)
    pg.fill('#nome', 'Teste'); pg.fill('#sobrenome', 'Site'); pg.fill('#email', 'abc@'); pg.fill('#senha', '123'); pg.fill('#confirmar', '1234')
    pg.click('#regForm button[type=submit]')
    errs = [e for e in ['erEmail', 'erSenha', 'erConfirmar', 'erTermos'] if vis(pg, '#' + e)]
    step('Cadastro', 'e-mail inválido / senha curta / confirmação diferente', len(errs) == 4, errs)
    pg.fill('#nome', '   '); pg.click('#regForm button[type=submit]')
    step('Cadastro', 'nome só com espaços é rejeitado', vis(pg, '#erNome'))
    pg.fill('#nome', 'Teste'); pg.fill('#email', EMAIL); pg.fill('#senha', SENHA); pg.fill('#confirmar', SENHA); pg.check('#termos')
    pg.click('#regForm button[type=submit]'); pg.wait_for_timeout(1500)
    tok = pg.evaluate("localStorage.getItem('omavest_token')")
    step('Cadastro', 'cadastro válido -> tela de sucesso + sessão', vis(pg, '#successScreen') and bool(tok), EMAIL)
    pg.goto(H + 'inscricao.html'); pg.wait_for_timeout(1500)
    step('Cadastro', 'logado e abre Criar Conta -> vai para Minha Área', 'area-candidato' in pg.url, pg.url)
    pg.wait_for_timeout(800)
    step('Minha Área', 'dashboard abre após cadastro', vis(pg, '#dashboardArea'))
    numero = pg.locator('#infoInscricao').inner_text().strip()
    step('Minha Área', 'mostra nº de inscrição', numero.startswith('OM'), numero)
    pg.evaluate('fazerLogout()'); pg.wait_for_timeout(1000)
    step('Logout', 'volta para o login e limpa a sessão', vis(pg, '#loginScreen') and not pg.evaluate("localStorage.getItem('omavest_token')"))
    r = pg.evaluate(f"fetch('/api/auth/perfil',{{headers:{{Authorization:'Bearer {tok}'}}}}).then(r=>r.status)")
    step('Logout', 'token antigo revogado no servidor (401)', r == 401, r)

    pg.goto(H + 'inscricao.html'); pg.wait_for_load_state('networkidle')
    pg.fill('#nome', 'Teste'); pg.fill('#sobrenome', 'Dup'); pg.fill('#email', EMAIL.upper()); pg.fill('#senha', SENHA); pg.fill('#confirmar', SENHA); pg.check('#termos')
    pg.click('#regForm button[type=submit]'); pg.wait_for_timeout(1500)
    step('Cadastro', 'e-mail já usado (em maiúsculas) -> erro', 'cadastrado' in pg.locator('#regAlert').inner_text(), pg.locator('#regAlert').inner_text())

    # HTML no nome não pode virar script
    pg.goto(H + 'inscricao.html'); pg.wait_for_load_state('networkidle')
    pg.fill('#nome', '<img src=x onerror="window.__xss=1">'); pg.fill('#sobrenome', 'Xss'); pg.fill('#email', f'teste+xss{RUN}@omavest.test')
    pg.fill('#senha', SENHA); pg.fill('#confirmar', SENHA); pg.check('#termos')
    pg.click('#regForm button[type=submit]'); pg.wait_for_timeout(1200)
    for pag in ['area-candidato', 'index', 'simulados']:
        pg.goto(H + pag + '.html'); pg.wait_for_timeout(1500)
        step('Segurança', f'nome com HTML não executa script em {pag}', not pg.evaluate('window.__xss'))
    pg.goto(H + 'area-candidato.html'); pg.wait_for_timeout(1200)
    if vis(pg, '#dashboardArea'):
        pg.evaluate('fazerLogout()'); pg.wait_for_timeout(800)

    # ── LOGIN ──────────────────────────────────────────────
    pg.goto(H + 'area-candidato.html'); pg.wait_for_timeout(1200)
    step('Rota protegida', 'Minha Área sem login mostra só o login', vis(pg, '#loginScreen') and not vis(pg, '#dashboardArea'))
    pg.click('#btnLogin'); pg.wait_for_timeout(300)
    step('Login', 'campos vazios', 'Preencha' in pg.locator('#loginAlert').inner_text(), pg.locator('#loginAlert').inner_text())
    pg.fill('#loginEmail', EMAIL); pg.fill('#loginSenha', 'errada123'); pg.click('#btnLogin'); pg.wait_for_timeout(1200)
    step('Login', 'senha errada', 'incorretos' in pg.locator('#loginAlert').inner_text(), pg.locator('#loginAlert').inner_text())
    pg.fill('#loginEmail', 'naoexiste@omavest.test'); pg.fill('#loginSenha', 'qualquer1'); pg.click('#btnLogin'); pg.wait_for_timeout(1200)
    step('Login', 'e-mail inexistente (mesma mensagem)', 'incorretos' in pg.locator('#loginAlert').inner_text(), pg.locator('#loginAlert').inner_text())
    pg.fill('#loginEmail', numero.lower()); pg.fill('#loginSenha', SENHA); pg.click('#btnLogin'); pg.wait_for_timeout(1500)
    step('Login', 'login pelo nº de inscrição (minúsculo)', vis(pg, '#dashboardArea'), numero.lower())

    def toast():
        pg.wait_for_timeout(600)
        return pg.locator('#toast').inner_text()

    pg.fill('#senhaAtual', ''); pg.fill('#senhaNova', NOVA); pg.fill('#senhaConf', NOVA); pg.evaluate('trocarSenha()'); t = toast()
    step('Trocar senha', 'sem senha atual', 'senha atual' in t.lower(), t)
    pg.fill('#senhaAtual', 'errada123'); pg.evaluate('trocarSenha()'); pg.wait_for_timeout(800); t = toast()
    step('Trocar senha', 'senha atual errada', 'incorreta' in t.lower(), t)
    pg.fill('#senhaAtual', SENHA); pg.fill('#senhaNova', '123'); pg.fill('#senhaConf', '123'); pg.evaluate('trocarSenha()'); t = toast()
    step('Trocar senha', 'nova senha curta', 'mínimo' in t.lower(), t)
    pg.fill('#senhaNova', NOVA); pg.fill('#senhaConf', NOVA + 'x'); pg.evaluate('trocarSenha()'); t = toast()
    step('Trocar senha', 'confirmação diferente', 'coincidem' in t.lower(), t)
    pg.fill('#senhaNova', NOVA); pg.fill('#senhaConf', NOVA); pg.evaluate('trocarSenha()'); pg.wait_for_timeout(1000); t = toast()
    step('Trocar senha', 'troca válida', 'sucesso' in t.lower(), t)
    pg.evaluate('fazerLogout()'); pg.wait_for_timeout(800)
    pg.fill('#loginEmail', EMAIL); pg.fill('#loginSenha', SENHA); pg.click('#btnLogin'); pg.wait_for_timeout(1200)
    step('Trocar senha', 'senha antiga deixa de funcionar', not vis(pg, '#dashboardArea'), pg.locator('#loginAlert').inner_text())
    pg.fill('#loginSenha', NOVA); pg.click('#btnLogin'); pg.wait_for_timeout(1500)
    step('Trocar senha', 'senha nova funciona', vis(pg, '#dashboardArea'))
    r = pg.evaluate("""async () => {
        const l = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identificador:'%s',senha:'%s'})}).then(r=>r.json());
        await fetch('/api/auth/trocar-senha',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+localStorage.getItem('omavest_token')},body:JSON.stringify({senha_atual:'%s',senha_nova:'%s'})});
        return fetch('/api/auth/perfil',{headers:{Authorization:'Bearer '+l.token}}).then(r=>r.status); }""" % (EMAIL, NOVA, NOVA, SENHA))
    step('Segurança', 'troca de senha derruba as outras sessões', r == 401, f'outra sessão -> {r}', conhecido='item 11')   # senha volta a ser SENHA

    pg.evaluate('fazerLogout()'); pg.wait_for_timeout(800)
    pg.evaluate('mostrarReset()'); pg.evaluate('enviarReset()'); a1 = pg.locator('#resetAlert').inner_text()
    pg.fill('#resetEmail', EMAIL); pg.evaluate('enviarReset()'); a2 = pg.locator('#resetAlert').inner_text()
    step('Recuperar senha', 'existe recuperação de senha', 'Firebase' not in a2, f'{a1} || {a2}', conhecido='item 8')

    # ── SIMULADO ───────────────────────────────────────────
    pg.evaluate('mostrarLogin()'); pg.fill('#loginEmail', EMAIL); pg.fill('#loginSenha', SENHA); pg.click('#btnLogin'); pg.wait_for_timeout(1500)
    p0 = progresso(pg, numero)
    step('Progresso', 'conta nova começa em 0%', bool(p0) and p0['valores'] == {'Matematica': 0, 'Portugues': 0, 'Ciencias': 0}, p0)

    # cards (página inicial e página Simulados) x configuração única em pc/data x simulado real
    ESP = esperado_simulados()
    LER_CARDS = """sel => Object.fromEntries([...document.querySelectorAll(sel)].map(c => {
        const t = c.textContent.replace(/\s+/g, ' '); return [c.dataset.materia,
          { q: +(t.match(/(\\d+) quest/) || [])[1] || null, min: +(t.match(/(\\d+) min/) || [])[1] || null }]; }))"""
    pg.goto(H + 'index.html'); pg.wait_for_load_state('networkidle')
    pg.wait_for_function("() => [...document.querySelectorAll('[data-campo=questoes]')].every(e => e.textContent !== '–')", timeout=10000)
    home = pg.evaluate(LER_CARDS, '.simulado-card[data-materia]')
    pg.goto(H + 'simulados.html'); pg.wait_for_load_state('networkidle')
    pg.wait_for_function("() => ![...document.querySelectorAll('.materia-meta')].some(e => e.textContent.includes('Carregando'))", timeout=10000)
    pagina = pg.evaluate(LER_CARDS, '.materia-card[data-materia]')
    esp = {m: {'q': v['q'], 'min': v['min']} for m, v in ESP.items()}
    difs = [f'{m}: início {home.get(m)} / página {pagina.get(m)} / esperado {esp[m]}' for m in esp if not (home.get(m) == pagina.get(m) == esp[m])]
    step('Simulado', 'cards da página inicial e da página Simulados = configuração única', not difs, difs[:3] or 'todos iguais')

    # nível sem questões: o card fica indisponível em vez de prometer o simulado e depois dar erro
    dialogs.clear()
    pg.click("[onclick=\"selecionarDificuldade('Fácil')\"]")
    sem_facil = sorted(m for m, v in ESP.items() if not v['por_nivel']['Fácil'])
    indisp = sorted(pg.evaluate("() => [...document.querySelectorAll('.materia-card.indisponivel')].map(c => c.dataset.materia)"))
    meta_mat = pg.locator('.materia-card[data-materia="Matemática"] .materia-meta').inner_text()
    step('Simulado', 'nível Fácil: matérias sem questões fáceis ficam indisponíveis', indisp == sem_facil, f'{indisp} | Matemática: "{meta_mat}"')
    metas = pg.evaluate("() => [...document.querySelectorAll('.materia-meta')].map(e => e.textContent)")
    um = sum(1 for v in ESP.values() if v['por_nivel']['Fácil'] == 1)
    step('Simulado', 'singular "1 questão" (nunca "1 questões")', sum(t.startswith('1 questão ·') for t in metas) == um and not any(t.startswith('1 questões') for t in metas), metas)
    pg.click("[onclick=\"iniciarSimulado('Matemática')\"]"); pg.wait_for_timeout(900)
    step('Simulado', 'card indisponível não abre simulado nem mostra alerta', not dialogs and not vis(pg, '#simuladoAndamento'), dialogs[-1:])
    pg.click("[onclick=\"iniciarSimulado('Inglês')\"]"); pg.wait_for_timeout(1200)
    niveis = pg.evaluate("[...document.querySelectorAll('[id^=qcard-] .questao-dificuldade')].map(e => [...e.classList].find(c => c !== 'questao-dificuldade'))")
    step('Simulado', 'Inglês no nível Fácil: só questões fáceis, na quantidade calculada',
         bool(niveis) and set(niveis) == {'Fácil'} and len(niveis) == ESP['Inglês']['por_nivel']['Fácil'], f'{len(niveis)} questões, níveis {sorted(set(niveis))}')
    pg.goto(H + 'simulados.html'); pg.wait_for_load_state('networkidle')
    pg.click("[onclick=\"iniciarSimulado('Biologia')\"]"); pg.wait_for_timeout(1200)
    textos = pg.evaluate("[...document.querySelectorAll('[id^=qcard-] .questao-enunciado')].map(e => e.innerText.trim())")
    n, unicas = len(textos), len(set(textos))
    step('Simulado', 'Biologia: sem questões repetidas', n > 0 and unicas == n, f'{n} exibidas, {unicas} distintas')
    step('Simulado', 'Biologia: nº de questões = o mostrado no card', n == ESP['Biologia']['q'], f"card {ESP['Biologia']['q']} x exibidas {n}")
    crono = pg.locator('#cronometro').inner_text(); pg.wait_for_timeout(2100); crono2 = pg.locator('#cronometro').inner_text()
    step('Simulado', 'cronômetro anda', crono != crono2, f'{crono} -> {crono2}')
    marcar = min(5, n)
    for i in range(marcar):
        pg.click(f'#alt-{i}-A')
    step('Simulado', 'contador de respondidas', f'{marcar}/' in pg.locator('#progressoQuestoes').inner_text(), pg.locator('#progressoQuestoes').inner_text())
    dialogs.clear(); pg.click("[onclick=\"finalizarSimulado()\"]"); pg.wait_for_timeout(1500)
    step('Simulado', 'finalizar incompleto pede confirmação', any('Deseja finalizar' in d for d in dialogs), dialogs[-1:])
    res = {k: pg.locator('#' + k).inner_text() for k in ['notaFinal', 'totalAcertos', 'totalErros', 'tempoGasto']}
    step('Simulado', 'resultado exibido', vis(pg, '#resultadoSimulado'), res)
    pg.screenshot(path=str(R.saida / 'simulado-resultado.png'))
    btn = pg.locator('[id^=btn-exp-]').first
    if btn.count():
        bid = btn.get_attribute('id').split('-')[-1]; btn.click(); pg.wait_for_timeout(2500)
        txt = pg.locator(f'#explicacao-{bid}').inner_text()
        step('Simulado', '"Entender por que errei" (IA)', len(txt) > 50 and 'alternativa' in txt.lower(), txt[:120].replace('\n', ' '))
    p1 = progresso(pg, numero)
    step('Progresso', 'simulado registrado', bool(p1 and p1.get('historico')), p1 and (p1.get('historico') or [None])[0])
    pg.goto(H + 'area-candidato.html'); pg.wait_for_timeout(1800)
    step('Progresso', 'Minha Área mostra o histórico', 'Biologia' in pg.locator('#progHist').inner_text(), pg.locator('#progHist').inner_text().replace('\n', ' ')[:100])
    (R.saida / 'site_account.json').write_text(json.dumps({'email': EMAIL, 'senha': SENHA, 'numero': numero}, ensure_ascii=False), encoding='utf-8')

    # tempo esgotado (relógio adiantado; sem animações para não travar o relógio simulado)
    ctx2 = br.new_context(reduced_motion='reduce'); d2, c2 = [], []; pc = nova_pagina(ctx2, d2, c2)
    pc.clock.install(); pc.goto(H + 'simulados.html'); pc.wait_for_load_state('networkidle')
    pc.click("[onclick=\"iniciarSimulado('Inglês')\"]"); pc.clock.run_for(2000); pc.wait_for_timeout(300)
    pc.clock.fast_forward('51:00'); pc.clock.run_for(3000); pc.wait_for_timeout(800)
    step('Simulado', 'tempo esgotado finaliza sozinho (Inglês, 50 min)', pc.locator('#resultadoSimulado').is_visible(), pc.locator('#cronometro').inner_text())
    ctx2.close()

    # ── REDAÇÃO ────────────────────────────────────────────
    pg.goto(H + 'redacao.html'); pg.wait_for_load_state('networkidle')
    pg.locator('[onclick^="abrirEditor"]').first.click(); pg.wait_for_timeout(500)
    dialogs.clear(); pg.evaluate('corrigirRedacao()'); pg.wait_for_timeout(400)
    step('Redação', 'enviar vazio', bool(dialogs), dialogs[-1:])
    dialogs.clear(); pg.fill('#redacaoTexto', 'Texto curto demais.'); pg.evaluate('corrigirRedacao()'); pg.wait_for_timeout(400)
    step('Redação', 'enviar curto (<100 caracteres)', bool(dialogs), dialogs[-1:])
    pg.fill('#redacaoTexto', TEXTO_REDACAO); pg.wait_for_timeout(200)
    cont = (pg.locator('#contPalavras').inner_text(), pg.locator('#contChars').inner_text())
    pg.evaluate('corrigirRedacao()'); pg.wait_for_selector('#painelResultado', state='visible', timeout=60000)
    nota = pg.locator('#notaTotal').inner_text().strip()
    step('Redação', 'correção válida', nota.isdigit(), f'nota={nota} palavras/caracteres={cont}')
    (R.saida / 'nota_redacao.txt').write_text(nota, encoding='utf-8')

    # ── NOTÍCIAS / PROVAS ──────────────────────────────────
    pg.goto(H + 'noticias.html'); pg.wait_for_load_state('networkidle')
    total = pg.locator('#countNum').inner_text()
    pg.click('.filter-btn[data-cat=urgente]'); urg = pg.locator('#countNum').inner_text()
    pg.click('.filter-btn[data-cat=all]'); pg.fill('#searchNoticias', 'fuvest'); fv = pg.locator('#countNum').inner_text()
    pg.fill('#searchNoticias', 'zzzz'); vazio = pg.locator('#emptyState').is_visible()
    step('Notícias', 'filtro e busca', vazio and int(urg) > 0 and int(fv) > 0, f'total={total} urgente={urg} fuvest={fv}')
    pg.fill('#searchNoticias', 'inscricoes'); sem_acento = pg.locator('#countNum').inner_text()
    step('Notícias', 'busca sem acento encontra "Inscrições"', int(sem_acento) > 0, sem_acento, conhecido='item 22')
    pg.goto(H + 'provas.html'); pg.wait_for_load_state('networkidle')
    cards = lambda: pg.evaluate("[...document.querySelectorAll('.prova-card')].filter(c => c.offsetParent !== null).length")
    allc = cards(); pg.click('.filter-btn[data-cat=fuvest]'); fu = cards()
    step('Provas', 'filtro FUVEST', 0 < fu < allc, f'todas={allc} fuvest={fu}')
    pg.fill('#searchProvas', 'zzzz'); step('Provas', 'busca sem resultado', cards() == 0, cards())
    pg.fill('#searchProvas', ''); pg.click('.filter-btn[data-cat=all]')
    # o PDF é interceptado (o navegador headless baixaria em vez de abrir)
    ctx.route('**/*.pdf', lambda r: r.fulfill(status=200, content_type='text/html', body='<html>pdf</html>'))
    with ctx.expect_page() as nova:
        pg.click("[onclick=\"baixarProva(1,'prova')\"]")
    nova.value.wait_for_load_state()
    step('Provas', 'botão Prova abre o PDF oficial em nova aba', 'fuvest.br' in nova.value.url, nova.value.url)
    nova.value.close(); ctx.unroute('**/*.pdf')

    # ── PÁGINA INICIAL ─────────────────────────────────────
    pg.goto(H + 'area-candidato.html'); pg.wait_for_timeout(1200)
    if vis(pg, '#dashboardArea'):
        pg.evaluate('fazerLogout()'); pg.wait_for_timeout(800)
    pg.goto(H + 'index.html'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(800)
    dias = int(pg.locator('#days').inner_text())
    dias_api = pg.evaluate("fetch('/api/cronograma').then(r=>r.json()).then(l=>{const p=l.find(c=>c.Titulo==='Prova');return Math.floor((new Date(p.data_inicio+'T09:00:00')-Date.now())/86400000)})")
    step('Início', 'contagem regressiva = data da prova da API', dias == dias_api, f'tela={dias} api={dias_api}')
    pg.click('#btnDemoHero'); pg.wait_for_timeout(2500)
    step('Início', 'botão "Entrar na conta demo"', 'seu progresso' in pg.locator('#hcardSub').inner_text(), pg.locator('#hcardSub').inner_text())
    pg.evaluate("localStorage.setItem('omavest_token','token-invalido')"); pg.goto(H + 'index.html'); pg.wait_for_timeout(1500)
    step('Sessão', 'token inválido não mostra o nome antigo no cabeçalho', pg.locator('#navUserLabel').inner_text().strip() in ('', 'Minha Área'),
         pg.locator('#navUserLabel').inner_text(), conhecido='item 24')
    pg.evaluate("localStorage.clear()")

    # ── SERVIDOR FORA DO AR / SEM INTERNET ─────────────────
    ctx3 = br.new_context(); d3, c3 = [], []; pe = nova_pagina(ctx3, d3, c3)
    pe.goto(H + 'area-candidato.html'); pe.wait_for_timeout(1000)
    ctx3.route('**/api/**', lambda r: r.abort('connectionrefused'))
    pe.fill('#loginEmail', EMAIL); pe.fill('#loginSenha', SENHA); pe.click('#btnLogin'); pe.wait_for_timeout(1500)
    step('Erros', 'servidor fora no login -> mensagem clara', 'conectar' in pe.locator('#loginAlert').inner_text(), pe.locator('#loginAlert').inner_text())
    pe.goto(H + 'inscricao.html'); pe.wait_for_timeout(800)
    pe.fill('#nome', 'X'); pe.fill('#sobrenome', 'Y'); pe.fill('#email', 'teste+off@omavest.test'); pe.fill('#senha', SENHA); pe.fill('#confirmar', SENHA); pe.check('#termos')
    pe.click('#regForm button[type=submit]'); pe.wait_for_timeout(1500)
    step('Erros', 'servidor fora no cadastro -> mensagem clara', 'conectar' in pe.locator('#regAlert').inner_text(), pe.locator('#regAlert').inner_text())
    pe.goto(H + 'simulados.html'); pe.wait_for_timeout(800)
    pe.click("[onclick=\"iniciarSimulado('Inglês')\"]"); pe.wait_for_timeout(1000); pe.click('#alt-0-A')
    pe.click("[onclick=\"finalizarSimulado()\"]"); pe.wait_for_timeout(1000)
    b = pe.locator('[id^=btn-exp-]').first
    if b.count():
        bid = b.get_attribute('id').split('-')[-1]; b.click(); pe.wait_for_timeout(2500)
        msg = pe.locator(f'#explicacao-{bid}').inner_text()
        step('Erros', 'servidor fora no "Entender por que errei" -> mensagem amigável', 'Failed to fetch' not in msg, msg[:120].replace('\n', ' '), conhecido='item 23')
    pe.goto(H + 'redacao.html'); pe.wait_for_timeout(800); pe.locator('[onclick^="abrirEditor"]').first.click()
    pe.fill('#redacaoTexto', TEXTO_REDACAO); d3.clear(); pe.evaluate('corrigirRedacao()'); pe.wait_for_timeout(3000)
    step('Erros', 'servidor fora na redação -> mensagem amigável', bool(d3) and 'Failed to fetch' not in d3[-1], d3[-1:], conhecido='item 23')
    pe.goto(H + 'index.html'); pe.wait_for_timeout(800)
    step('Erros', 'servidor fora: contagem usa a data padrão', pe.locator('#days').inner_text() not in ('', '00'), pe.locator('#days').inner_text())
    ctx3.close()

    step('Console', 'sem erros de console nos fluxos (fora os 401/409 provocados)', not cons, cons[:5])
    step('Rede', 'nenhuma chamada das páginas recebeu 404 ou 5xx', not HTTP_ERROS, HTTP_ERROS[:5])
    br.close()

sys.exit(R.fim())
