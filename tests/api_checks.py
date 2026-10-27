"""Verificações da API: segurança das rotas e regressão dos fluxos usados pelo site e pelo app.

Grava apenas uma conta de teste (teste+api<hora>@omavest.test). Use via run_tests.py para restaurar o banco depois.
"""
import json
import socket
import sys
import time
import urllib.error
import urllib.request

from _comum import API, Relatorio

R = Relatorio('api', sys.argv[1] if len(sys.argv) > 1 else None)


def req(metodo, url, corpo=None, token=None, timeout=15):
    dados = json.dumps(corpo).encode() if corpo is not None else None
    h = {'Content-Type': 'application/json'}
    if token:
        h['Authorization'] = f'Bearer {token}'
    r = urllib.request.Request(url, data=dados, method=metodo, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            texto = resp.read().decode('utf-8', 'replace')
            return resp.status, texto, dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace'), dict(e.headers)


def js(texto):
    try:
        return json.loads(texto)
    except Exception:
        return {}


def ip_da_rede():
    """IP não-loopback deste PC (para simular um acesso vindo de outro computador da rede)."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
        s.close()
        if not ip.startswith('127.'):
            return ip
    except OSError:
        pass
    for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
        if not ip.startswith(('127.', '169.254.')):
            return ip
    return None


st, _, _ = req('GET', f'{API}/health')
if not R.step('API', 'servidor no ar (/api/health)', st == 200, st):
    sys.exit(R.fim())

# ── ROTAS SEM PROTEÇÃO (corrigidas no Lote 1: as rotas foram removidas) ──
LAN = ip_da_rede()
API_LAN = API.replace('127.0.0.1', LAN).replace('localhost', LAN) if LAN else None
if API_LAN:
    st, _, _ = req('GET', f'{API_LAN}/admin/importacao/fontes')
    R.step('Segurança', f'importação de PDF continua bloqueada pela rede ({LAN})', st == 403, st)
    st, _, _ = req('GET', f'{API_LAN}/admin/questoes?tamanho=1')
    R.step('Segurança', 'GET /api/admin/questoes pela rede não responde dados', st != 200, st)
    for metodo in ('PUT', 'DELETE'):
        st, txt, _ = req(metodo, f'{API_LAN}/admin/questoes/999999', {'RespostaCorreta': 'A'} if metodo == 'PUT' else None)
        R.step('Segurança', f'{metodo} /api/admin/questoes/{{id}} pela rede não chega à lógica', 'não encontrada' not in txt.lower(), f'{st} {txt[:80]}')
else:
    R.step('Segurança', 'teste pela rede local', True, 'pulado: nenhum IP de rede encontrado')

st, txt, _ = req('GET', f'{API}/inscricao/OM-DEMO')
R.step('Segurança', 'GET /api/inscricao/{n} sem token não expõe dados', 'Cpf' not in txt, st)
st, txt, _ = req('GET', f'{API}/inscricao/OM-DEMO', token='token-invalido')
R.step('Segurança', 'GET /api/inscricao/{n} com token inválido não expõe dados', 'Cpf' not in txt, st)
for rota in ('boleto/OM-DEMO', 'candidato/comprovante/OM-DEMO', 'resultado/OM-DEMO', 'local-prova/OM-DEMO'):
    st, txt, _ = req('GET', f'{API}/{rota}')
    # 404 = rota não existe; 401 = exige login. (403 de local-prova é só a data de divulgação, a rota continua aberta.)
    R.step('Segurança', f'GET /api/{rota.split("/OM")[0]}/{{n}} sem token não está aberta', st in (401, 404), f'{st} {txt[:60]}')
# número inexistente: se a rota existir sem proteção, responde "Inscrição não encontrada" (sem gravar nada)
st, txt, _ = req('POST', f'{API}/pagamento/confirmar', {'NumeroInscricao': 'OM-INEXISTENTE-QA'})
R.step('Segurança', 'POST /api/pagamento/confirmar sem token não chega à lógica', st in (401, 403, 404, 405) and 'não encontrada' not in txt.lower(), f'{st} {txt[:80]}')
# corpo vazio: se a rota existir, responde 400 de validação (sem gravar nada)
st, txt, _ = req('POST', f'{API}/inscricao', {})
R.step('Segurança', 'POST /api/inscricao anônimo não existe/está protegido', st in (401, 403, 404, 405), st)

# ── REGRESSÃO: fluxos usados pelo site e pelo app ────────────────────
email = f'teste+api{time.strftime("%H%M%S")}@omavest.test'
st, txt, _ = req('POST', f'{API}/auth/registrar', {'nome': 'Teste Api', 'email': email, 'senha': 'Senha@1234'})
d = js(txt)
R.step('Auth', 'cadastro', st == 201 and d.get('token'), st)
tok, numero = d.get('token'), (d.get('usuario') or {}).get('NumeroInscricao')
st, txt, _ = req('POST', f'{API}/auth/registrar', {'nome': 'Teste Api', 'email': email.upper(), 'senha': 'Senha@1234'})
R.step('Auth', 'cadastro com e-mail repetido (maiúsculas) -> 409', st == 409, st)
st, txt, _ = req('POST', f'{API}/auth/registrar', {'nome': 'X', 'email': 'invalido', 'senha': '123'})
R.step('Auth', 'cadastro inválido -> 400', st == 400, js(txt).get('message'))
st, txt, _ = req('GET', f'{API}/auth/perfil', token=tok)
R.step('Auth', 'perfil com token', st == 200 and js(txt).get('usuario', {}).get('Email') == email, st)
st, _, _ = req('GET', f'{API}/auth/perfil')
R.step('Auth', 'perfil sem token -> 401', st == 401, st)
st, txt, _ = req('POST', f'{API}/auth/login', {'identificador': numero, 'senha': 'Senha@1234'})
R.step('Auth', 'login pelo nº de inscrição', st == 200, st)
tok2 = js(txt).get('token')
st, txt, _ = req('POST', f'{API}/auth/login', {'identificador': email, 'senha': 'errada'})
R.step('Auth', 'login com senha errada -> 401', st == 401, js(txt).get('message'))
st, txt, _ = req('POST', f'{API}/auth/login', {'identificador': 'demo@omavest.com', 'senha': '123456'})
d = js(txt)
R.step('Auth', 'login da conta demo traz inscrição', st == 200 and (d.get('inscricao') or {}).get('Status') == 'inscrito', st)
st, txt, _ = req('GET', f'{API}/candidato/dashboard', token=d.get('token'))
R.step('Candidato', 'dashboard com token', st == 200 and js(txt).get('dias_para_prova') is not None, st)
st, _, _ = req('GET', f'{API}/candidato/dashboard')
R.step('Candidato', 'dashboard sem token -> 401', st == 401, st)
st, txt, _ = req('POST', f'{API}/auth/trocar-senha', {'senha_atual': 'Senha@1234', 'senha_nova': 'Nova@12345'}, token=tok)
R.step('Auth', 'trocar senha', st == 200, st)
st, _, _ = req('GET', f'{API}/auth/perfil', token=tok2)
R.step('Segurança', 'troca de senha derruba as outras sessões', st == 401, f'outra sessão -> {st}', conhecido='item 11')
st, _, _ = req('POST', f'{API}/auth/logout', token=tok)
st2, _, _ = req('GET', f'{API}/auth/perfil', token=tok)
R.step('Auth', 'logout revoga o token', st == 200 and st2 == 401, f'logout {st}, perfil depois {st2}')

for rota, cond in [('cronograma', lambda d: isinstance(d, list) and len(d) == 6),
                   ('noticias?limite=15', lambda d: d.get('total', 0) > 0),
                   ('noticias/recentes?limite=3', lambda d: len(d.get('data', [])) == 3),
                   ('provas', lambda d: d.get('total', 0) > 0),
                   ('questoes?limit=5', lambda d: d.get('total') == 5),
                   ('questoes/materias', lambda d: len(d.get('data', [])) > 0),
                   ('ia/status', lambda d: d.get('success') is True)]:
    st, txt, _ = req('GET', f'{API}/{rota}')
    R.step('Conteúdo', f'GET /api/{rota}', st == 200 and cond(js(txt)), st)
st, txt, _ = req('POST', f'{API}/ia/explicacao', {'prompt': 'RESPOSTA CORRETA: A\nRESPOSTA DO ALUNO: B\nA) um\nB) dois'})
R.step('IA', 'explicação', st == 200 and len(js(txt).get('texto', '')) > 50, f"{st} modo={js(txt).get('modo')}")
st, txt, _ = req('POST', f'{API}/ia/redacao', {'tema': 'Tema', 'texto': 'Texto de teste com mais de cem caracteres para a correção da redação; portanto deve funcionar normalmente.'})
R.step('IA', 'correção de redação', st == 200 and 'nota_total' in js(txt), st)
st, _, _ = req('POST', f'{API}/ia/explicacao', {'prompt': ''})
R.step('IA', 'explicação com prompt vazio -> 400', st == 400, st)

# ── Problemas conhecidos de lotes futuros (informativo) ──────────────
codes = [req('POST', f'{API}/auth/login', {'identificador': email, 'senha': f'errada{i}'})[0] for i in range(12)]
R.step('Segurança', 'limite de tentativas de login (espera 429 em algum momento)', 429 in codes, f'{codes.count(401)}x401 {codes.count(429)}x429', conhecido='item 9')
codes = [req('POST', f'{API}/ia/explicacao', {'prompt': 'teste'})[0] for _ in range(15)]
R.step('Segurança', 'IA exige login ou tem limite', any(c in (401, 429) for c in codes), f'{codes.count(200)}x200', conhecido='item 10')
base = API.rsplit('/api', 1)[0]
st, _, _ = req('GET', f'{base}/backend/obj/project.assets.json')
R.step('Segurança', 'arquivos internos do backend não são públicos', st == 404, st, conhecido='item 15')
st, _, h = req('GET', f'{base}/html/index.html')
faltam = [x for x in ('X-Content-Type-Options', 'X-Frame-Options', 'Content-Security-Policy') if x not in h]
R.step('Segurança', 'cabeçalhos de segurança', not faltam, f'faltam: {faltam}', conhecido='item 26')

sys.exit(R.fim())
