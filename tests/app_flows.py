"""Fluxos do app OMAVEST no Expo Web, em formato de celular.

Uso: python app_flows.py <pasta_saida> [<site_account.json gerado por site_flows.py>]
Cria a conta de teste teste+app<hora>@omavest.test. Use via run_tests.py para restaurar o banco depois.
"""
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

from _comum import APP, Relatorio, esperado_simulados

R = Relatorio('app_flows', sys.argv[1] if len(sys.argv) > 1 else None)
SITE_ACC = json.loads(Path(sys.argv[2]).read_text(encoding='utf-8')) if len(sys.argv) > 2 and Path(sys.argv[2]).exists() else None
EMAIL = f'teste+app{time.strftime("%H%M%S")}@omavest.test'
SENHA = 'Senha@1234'
TEXTO_REDACAO = (
    'A valorização da herança africana no Brasil enfrenta obstáculos históricos. Segundo dados do IBGE, a maioria da população '
    'se declara negra ou parda, contudo o racismo estrutural persiste. ' * 2
    + '\n\nAlém disso, a escola ainda trata a cultura afro-brasileira de forma superficial, embora a Lei 10.639 torne obrigatório o '
    'ensino de história africana. Dessa forma, o problema se perpetua.\n\nPortanto, cabe ao Ministério da Educação, por meio de '
    'formação continuada de professores, garantir a aplicação da lei, a fim de valorizar a contribuição africana na formação nacional.')
IGNORAR_CONSOLE = ('ERR_INTERNET_DISCONNECTED', 'ERR_CONNECTION_REFUSED', 'ERR_FAILED', 'Network Error',
                   'status of 401 ', 'status of 409 ')   # 401/409: o próprio teste provoca (senha errada, e-mail repetido)
HTTP_ERROS = []   # respostas 404/5xx da API (ex.: o app chamando uma rota que não existe mais)
step = R.step

with sync_playwright() as p:
    br = p.chromium.launch(headless=True)

    def novo_contexto(w=375, h=812):
        ctx = br.new_context(viewport={'width': w, 'height': h}, is_mobile=w < 700, has_touch=True)
        # window.open é registrado em vez de abrir abas (o app usa Linking.openURL -> window.open no web)
        ctx.add_init_script("window.__abertas = []; window.open = (u) => { window.__abertas.push(String(u)); return null; };")
        pg = ctx.new_page()
        dialogs, cons = [], []
        pg.on('dialog', lambda d: (dialogs.append(d.message.replace('\n', ' ')[:200]), d.accept()))
        pg.on('console', lambda m: cons.append(m.text[:200]) if m.type == 'error' and not any(x in m.text for x in IGNORAR_CONSOLE) else None)
        pg.on('pageerror', lambda e: cons.append('pageerror ' + str(e)[:200]))
        pg.on('response', lambda r: HTTP_ERROS.append(f'{r.status} {r.request.method} {r.url[:100]}') if ':5000/' in r.url and (r.status == 404 or r.status >= 500) else None)
        pg.goto(APP); pg.wait_for_selector('text=Progresso de Estudos', timeout=90000); pg.wait_for_timeout(800)
        return ctx, pg, dialogs, cons

    ctx, pg, dialogs, cons = novo_contexto()
    T = lambda s, exact=True: pg.get_by_text(s, exact=exact).locator('visible=true')
    ph = lambda s: pg.get_by_placeholder(s, exact=True).locator('visible=true')

    def tem(s, exact=True):
        return T(s, exact).count() > 0

    def tab(nome):
        T(nome).last.click(); pg.wait_for_timeout(900)

    def menu(nome):
        pg.get_by_label('Abrir menu').locator('visible=true').first.click(); pg.wait_for_timeout(400)
        T(nome).last.click(); pg.wait_for_timeout(1200)

    def corpo():
        return pg.locator('body').inner_text()

    def cards_simulado():
        return pg.locator('text=/\\d+ questões · \\d+ min/').locator('visible=true').all_inner_texts()

    dias = T('DIAS').first.locator('xpath=..').inner_text().split('\n')[0].strip()
    step('Início', 'carrega e mostra contagem regressiva', dias.isdigit(), f'{dias} dias')

    # ── LOGIN ──────────────────────────────────────────────
    tab('Minha Área')
    T('Entrar').last.click(); pg.wait_for_timeout(400)
    step('Login', 'campos vazios', tem('Informe seu e-mail ou número de inscrição') and tem('Informe a senha'))
    login_email = SITE_ACC['email'] if SITE_ACC else 'demo@omavest.com'
    login_senha = SITE_ACC['senha'] if SITE_ACC else '123456'
    ph('joao@email.com').fill(login_email); ph('Sua senha').fill('errada123'); dialogs.clear()
    T('Entrar').last.click(); pg.wait_for_timeout(1500)
    step('Login', 'senha errada', any('incorretos' in d for d in dialogs), dialogs[-1:])
    dialogs.clear(); T('Esqueci a senha').click(); pg.wait_for_timeout(300)
    step('Recuperar senha', 'existe recuperação de senha', not any('Firebase' in d for d in dialogs), dialogs[-1:], conhecido='item 8')
    ph('Sua senha').fill(login_senha); T('Entrar').last.click(); pg.wait_for_timeout(2000)
    step('Login', f'login ({"conta criada no site" if SITE_ACC else "demo"})', tem('Meus Dados', False), login_email)
    if SITE_ACC:
        step('Minha Área', 'mesmo nº de inscrição do site', SITE_ACC['numero'] in corpo(), SITE_ACC['numero'])
        hist = corpo().split('ÚLTIMOS SIMULADOS')[-1][:300]
        step('Consistência', 'simulado feito no SITE aparece no APP', 'Biologia' in hist, hist[:90].replace('\n', ' '), conhecido='item 7')
    pg.screenshot(path=str(R.saida / 'painel.png'))

    for (a, n, c, esperado) in [('', 'Nova@12345', 'Nova@12345', 'senha atual'), ('x', '123', '123', 'mínimo'), ('x', 'Nova@12345', 'Outra@12345', 'coincidem')]:
        ph('Senha atual').fill(a); ph('Nova senha (mín. 8 caracteres)').fill(n); ph('Confirmar nova senha').fill(c); dialogs.clear()
        T('Salvar nova senha').click(); pg.wait_for_timeout(600)
        step('Trocar senha', f'validação: {esperado}', any(esperado in d.lower() for d in dialogs), dialogs[-1:])
    ph('Senha atual').fill('errada123'); ph('Nova senha (mín. 8 caracteres)').fill('Nova@12345'); ph('Confirmar nova senha').fill('Nova@12345'); dialogs.clear()
    T('Salvar nova senha').click(); pg.wait_for_timeout(1200)
    step('Trocar senha', 'senha atual errada', any('incorreta' in d.lower() for d in dialogs), dialogs[-1:])

    # ── SIMULADO ───────────────────────────────────────────
    ESP = esperado_simulados()
    esperado_txt = [f"{v['q']} questões · {v['min']} min" for v in ESP.values()]
    tab('Início'); pg.wait_for_timeout(1500)
    home_q = pg.locator('text=/^\\d+ questões$/').locator('visible=true').all_inner_texts()
    home_min = pg.locator('text=/^\\d+ minutos$/').locator('visible=true').all_inner_texts()
    home = [f"{q.split()[0]} questões · {mi.split()[0]} min" for q, mi in zip(home_q, home_min)]
    step('Simulado', 'cards da tela Início = configuração única', home == esperado_txt, home if home != esperado_txt else 'todos iguais')
    tab('Simulados'); pg.wait_for_timeout(800)
    cards = cards_simulado()
    step('Simulado', 'cards da tela Simulados = configuração única', cards == esperado_txt, cards if cards != esperado_txt else 'todos iguais')
    T('Fácil').first.click(); pg.wait_for_timeout(300)
    sem_facil = sum(1 for v in ESP.values() if not v['por_nivel']['Fácil'])
    n_indisp = T('Sem questões neste nível').count()
    step('Simulado', 'nível Fácil: matérias sem questões fáceis ficam indisponíveis', n_indisp == sem_facil == T('Indisponível').count(),
         f'{n_indisp} cards "Sem questões neste nível" (esperado {sem_facil})')
    um = sum(1 for v in ESP.values() if v['por_nivel']['Fácil'] == 1)
    singular = pg.locator('text=/^1 questão · \\d+ min$/').locator('visible=true').count()
    plural_errado = pg.locator('text=/^1 questões/').locator('visible=true').count()
    step('Simulado', 'singular "1 questão" (nunca "1 questões")', singular == um and not plural_errado, f'{singular} cards com "1 questão" (esperado {um}), "1 questões": {plural_errado}')
    dialogs.clear(); T('Indisponível').first.click(); pg.wait_for_timeout(700)
    abriu = pg.locator('text=/Questão 1 de \\d+/').locator('visible=true').count() > 0
    step('Simulado', 'card indisponível não abre simulado nem mostra alerta', not abriu and not dialogs, dialogs[-1:])
    T('Misto').first.click(); pg.wait_for_timeout(300); T('Iniciar').nth(4).click(); pg.wait_for_timeout(1500)
    head = pg.locator('text=/Questão 1 de \\d+/').locator('visible=true').first.inner_text()
    total_bio = int(head.split(' de ')[-1])
    step('Simulado', 'Biologia: nº de questões = o mostrado no card', total_bio == ESP['Biologia']['q'], f"card {ESP['Biologia']['q']} x {head}")
    t1 = pg.locator('text=/^\\d\\d:\\d\\d$/').locator('visible=true').first.inner_text(); pg.wait_for_timeout(2100)
    t2 = pg.locator('text=/^\\d\\d:\\d\\d$/').locator('visible=true').first.inner_text()
    step('Simulado', 'cronômetro regressivo', t1 != t2, f'{t1} -> {t2}')
    letras = pg.locator('text=/^[A-E]$/').locator('visible=true')
    letras.nth(0).click(); letras.nth(5).click(); letras.nth(10).click(); pg.wait_for_timeout(300)
    step('Simulado', 'contador de respondidas', tem('3/', False), pg.locator('text=/\\d+\\/\\d+ respondidas/').first.inner_text())
    dialogs.clear(); T('Finalizar simulado').click(); pg.wait_for_timeout(1500)
    step('Simulado', 'finalizar incompleto pede confirmação', any('Deseja finalizar' in d for d in dialogs), dialogs[-1:])
    step('Simulado', 'resultado exibido', tem('RESULTADO'))
    if T('Entender por que errei').count():
        T('Entender por que errei').first.click(); pg.wait_for_timeout(2500)
        step('Simulado', '"Entender por que errei" (IA)', tem('Explicação gerada no modo offline do OMAVEST', False) or tem('Gerado pela IA', False))
    pg.screenshot(path=str(R.saida / 'simulado-resultado.png'))
    tab('Minha Área'); pg.wait_for_timeout(800)
    hist = corpo().split('ÚLTIMOS SIMULADOS')[-1][:200]
    step('Progresso', 'simulado do app aparece na Minha Área do app', 'Biologia' in hist, hist[:80].replace('\n', ' '))
    dialogs.clear(); T('Sair').click(); pg.wait_for_timeout(1200)
    step('Logout', 'pede confirmação e sai', any('Deseja sair' in d for d in dialogs) and tem('Bem-vindo de volta'), dialogs[-1:])

    # ── CADASTRO ───────────────────────────────────────────
    T('Criar conta grátis').click(); pg.wait_for_timeout(600)
    T('Criar conta').last.click(); pg.wait_for_timeout(400)
    errs = [e for e in ['Nome obrigatório', 'Sobrenome obrigatório', 'E-mail inválido', 'Mínimo 8 caracteres', 'Você precisa aceitar os termos'] if tem(e)]
    step('Cadastro', 'enviar vazio mostra erros', len(errs) == 5, errs)
    ph('João').fill('Teste'); ph('Silva').fill('App'); ph('joao@email.com').fill('demo@omavest.com'.upper())
    ph('Mínimo 8 caracteres').fill(SENHA); ph('Repita a senha').fill(SENHA + 'x')
    T('Criar conta').last.click(); pg.wait_for_timeout(300)
    step('Cadastro', 'confirmação diferente', tem('As senhas não coincidem'))
    abertas_antes = pg.evaluate('window.__abertas.length')
    T('termos de uso').first.click(); pg.wait_for_timeout(500)
    # título exato: a busca sem diferenciar maiúsculas acharia o próprio texto "Li e aceito os termos de uso"
    step('Cadastro', 'link "termos de uso" abre os termos', pg.evaluate('window.__abertas.length') > abertas_antes or tem('Termos de Uso', True),
         'nada aconteceu', conhecido='item 18')
    ph('Repita a senha').fill(SENHA)
    # tocar no link também alterna a caixa de aceite (o texto fica dentro do mesmo botão)
    dialogs.clear(); T('Criar conta').last.click(); pg.wait_for_timeout(1500)
    if tem('Você precisa aceitar os termos'):
        T('Li e aceito os', False).first.click(); dialogs.clear(); T('Criar conta').last.click(); pg.wait_for_timeout(1500)
    step('Cadastro', 'e-mail já usado -> erro do servidor', any('cadastrado' in d for d in dialogs), dialogs[-1:])
    ph('joao@email.com').fill(EMAIL); T('Criar conta').last.click(); pg.wait_for_timeout(2000)
    step('Cadastro', 'cadastro válido entra na Minha Área', tem('Meus Dados', False), EMAIL)
    prog = corpo().split('Progresso de estudos')[-1][:200]
    step('Progresso', 'conta nova começa em 0%', '0%' in prog, prog[:100].replace('\n', ' '))

    # ── NOTÍCIAS / PROVAS / CRONOGRAMA ─────────────────────
    menu('Notícias')
    contagem = lambda: pg.locator('text=/\\d+ notícias? encontradas?/').locator('visible=true').first.inner_text()
    total = contagem(); T('Urgente').first.click(); urg = contagem()
    T('Todas').first.click(); ph('Buscar notícias...').fill('inscricoes'); s1 = contagem()
    ph('Buscar notícias...').fill('zzzz'); vazio = tem('Nenhuma notícia encontrada.')
    step('Notícias', 'lista, filtro e busca (ignora acento)', vazio and not s1.startswith('0'), f'total="{total}" urgente="{urg}" inscricoes="{s1}"')
    ph('Buscar notícias...').fill('Provas e gabaritos'); pg.wait_for_timeout(300)
    if T('Baixar provas').count():
        T('Baixar provas').first.click(); pg.wait_for_timeout(1200)
    step('Notícias', 'link "Baixar provas" leva às provas', tem('Provas Anteriores'), 'nenhuma ação', conhecido='item 21')
    menu('Provas')
    anos = lambda: pg.locator('text=/^\\d{4}$/').locator('visible=true').count()
    allp = anos(); T('FUVEST').first.click(); fu = anos()
    step('Provas', 'lista e filtro FUVEST', 0 < fu < allp, f'todas={allp} fuvest={fu}')
    pg.evaluate('window.__abertas = []'); T('Prova').first.click(); T('Gabarito').first.click(); pg.wait_for_timeout(500)
    abertas = pg.evaluate('window.__abertas')
    step('Provas', 'botões Prova e Gabarito abrem os PDFs oficiais', len(abertas) == 2 and all('fuvest.br' in u for u in abertas), abertas)
    tab('Cronograma'); pg.wait_for_timeout(1200)
    b = corpo().lower()
    step('Cronograma', 'status calculados', b.count('em andamento') >= 1 and b.count('em breve') >= 1, f"em andamento={b.count('em andamento')} em breve={b.count('em breve')} concluído={b.count('concluído')}")

    # ── REDAÇÃO ────────────────────────────────────────────
    tab('Redação'); T('Escrever').first.click(); pg.wait_for_timeout(600)
    dialogs.clear(); T('Corrigir com IA').click(); pg.wait_for_timeout(400)
    step('Redação', 'enviar vazio/curto', any('curta' in d for d in dialogs), dialogs[-1:])
    pg.locator('textarea').locator('visible=true').first.fill(TEXTO_REDACAO)
    T('Corrigir com IA').click(); pg.wait_for_selector('text=RESULTADO DA CORREÇÃO — ENEM', timeout=60000)
    nota = pg.locator('text=pontos de 1000 possíveis').locator('visible=true').locator('xpath=preceding-sibling::*[1]').inner_text()
    nota_site = (R.saida.parent / 'site_flows' / 'nota_redacao.txt')
    det = f'nota={nota}' + (f' (site: {nota_site.read_text()})' if nota_site.exists() else '')
    step('Redação', 'correção válida (mesma nota do site)', nota.strip().isdigit() and (not nota_site.exists() or nota_site.read_text() == nota.strip()), det)

    # ── VOLTAR DO NAVEGADOR ────────────────────────────────
    tab('Início'); menu('Notícias'); pg.go_back(); pg.wait_for_timeout(1500)
    step('Navegação', 'voltar do navegador fica no app', 'localhost:8081' in pg.url, pg.url, conhecido='item 25')
    step('Console', 'sem erros de console (fora os 401/409 provocados)', not cons, cons[:5])
    step('Rede', 'nenhuma chamada do app à API recebeu 404 ou 5xx', not HTTP_ERROS, HTTP_ERROS[:5])
    ctx.close()

    # ── SEM INTERNET (com dados já carregados) ─────────────
    ctx, pg, dialogs, cons = novo_contexto()
    tab('Simulados'); pg.wait_for_timeout(1200); tab('Cronograma'); pg.wait_for_timeout(1200); tab('Início')
    ctx.set_offline(True); pg.wait_for_timeout(1200)
    step('Offline', 'aviso "Sem conexão" aparece', tem('Sem conexão — exibindo dados salvos'))
    tab('Cronograma'); pg.wait_for_timeout(1500)
    step('Offline', 'Cronograma mostra os dados salvos', tem('Prova', False) and tem('Dados offline', False))
    tab('Simulados'); T('Iniciar').nth(7).click(); pg.wait_for_timeout(1200)
    step('Offline', 'simulado já carregado abre offline', pg.locator('text=/Questão 1 de \\d+/').locator('visible=true').count() > 0)
    tab('Minha Área'); pg.wait_for_timeout(600)
    ph('joao@email.com').fill(EMAIL); ph('Sua senha').fill(SENHA); dialogs.clear(); T('Entrar').last.click(); pg.wait_for_timeout(2500)
    step('Offline', 'login sem internet -> mensagem clara', any('servidor' in d.lower() for d in dialogs), dialogs[-1:])
    ctx.set_offline(False); pg.wait_for_timeout(3000)
    step('Offline', 'aviso some ao reconectar', not tem('Sem conexão — exibindo dados salvos'), '', conhecido='inconclusivo no navegador (NetInfo web)')
    ctx.close()

    # ── SERVIDOR FORA DO AR AO ABRIR AS TELAS (item 6) ─────
    ctx, pg, dialogs, cons = novo_contexto()
    ctx.route('**localhost:5000/**', lambda r: r.abort('connectionrefused'))
    tab('Simulados'); pg.wait_for_timeout(1500)
    fora = cards_simulado()[:2]
    dialogs.clear()
    if T('Iniciar').count():
        T('Iniciar').nth(0).click(); pg.wait_for_timeout(800)
    avisou = tem('conexão', False) or tem('servidor', False)
    step('Servidor fora', 'Simulados avisa que não conseguiu falar com o servidor', avisou and not any('Ainda não há questões' in d for d in dialogs),
         f'cards={fora} alerta={dialogs[-1:]}', conhecido='item 6')
    tab('Redação'); pg.wait_for_timeout(1200)
    ctx.unroute('**localhost:5000/**')
    tab('Início'); pg.wait_for_timeout(800); tab('Simulados'); pg.wait_for_timeout(2500)
    depois = cards_simulado()[:2]
    step('Servidor fora', 'Simulados se recupera quando o servidor volta', bool(depois) and not depois[0].startswith('0 '), f'antes={fora} depois={depois}', conhecido='item 6')
    tab('Redação'); pg.wait_for_timeout(2500)
    step('Servidor fora', 'Redação se recupera quando o servidor volta', T('Escrever').count() > 0, f"temas={T('Escrever').count()}", conhecido='item 6')
    ctx.route('**localhost:5000/**', lambda r: r.abort('connectionrefused'))
    tab('Minha Área'); ph('joao@email.com').fill(EMAIL); ph('Sua senha').fill(SENHA); dialogs.clear(); T('Entrar').last.click(); pg.wait_for_timeout(2500)
    step('Servidor fora', 'login com servidor desligado -> mensagem clara', any('servidor' in d.lower() for d in dialogs), dialogs[-1:])
    ctx.close()

    # ── TAMANHOS DE TELA ───────────────────────────────────
    for nome, (w, h) in {'320x568': (320, 568), '375x812': (375, 812), '414x896': (414, 896), 'tablet-768x1024': (768, 1024)}.items():
        ctx, pg, dialogs, cons = novo_contexto(w, h)
        largura = []
        for t in ['Início', 'Simulados', 'Redação', 'Cronograma', 'Minha Área']:
            pg.get_by_text(t, exact=True).locator('visible=true').last.click(); pg.wait_for_timeout(800)
            sw = pg.evaluate('Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)')
            if sw > w:
                largura.append(f'{t}: {sw}px')
            if w in (320, 768):
                pg.screenshot(path=str(R.saida / f'tela-{nome}-{t.replace(" ", "")}.png'))
        step('Telas', f'{nome}: nada sai da largura da tela', not largura, largura)
        ctx.close()
    br.close()

sys.exit(R.fim())
