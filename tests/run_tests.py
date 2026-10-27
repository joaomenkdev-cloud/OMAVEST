"""Executa os testes do OMAVEST e devolve o banco ao estado anterior.

Uso (a partir da pasta L-hub):
    python tests/run_tests.py                 # todas as suítes
    python tests/run_tests.py api site        # só algumas: dados, segredos, api, crawl, site, app

O que ele faz:
  1. Se o servidor (porta 5000) NÃO estiver rodando: faz backup de pc/backend/omavest.db*, sobe o servidor
     e, no final, desliga o servidor e restaura o banco (os testes criam contas teste+...@omavest.test).
     Se o servidor JÁ estiver rodando, os testes usam esse servidor e o banco NÃO é restaurado.
  2. Se a suíte "app" for pedida e o Expo (porta 8081) não estiver rodando, sobe o Expo Web e desliga no final.
  3. Resultados, capturas de tela e JSON em tests/_saida/.
"""
import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TESTS = RAIZ / 'tests'
SAIDA = TESTS / '_saida'
BACKEND = RAIZ / 'pc' / 'backend'
APPDIR = RAIZ / 'mobile' / 'LHubApp' / 'LHubApp'
DB_ARQS = ['omavest.db', 'omavest.db-wal', 'omavest.db-shm']
ORDEM = ['dados', 'segredos', 'api', 'crawl', 'site', 'app']

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)


def porta_aberta(porta):
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', porta)) == 0


def esperar_url(url, segundos):
    fim = time.time() + segundos
    while time.time() < fim:
        try:
            with urllib.request.urlopen(url, timeout=3) as r:
                if r.status == 200:
                    return True
        except Exception:
            time.sleep(1)
    return False


def matar(proc):
    if proc and proc.poll() is None:
        subprocess.run(['taskkill', '/PID', str(proc.pid), '/T', '/F'], capture_output=True)


def esperar_porta_fechar(porta, segundos=20):
    fim = time.time() + segundos
    while time.time() < fim and porta_aberta(porta):
        time.sleep(0.5)


def backup_db(destino):
    destino.mkdir(parents=True, exist_ok=True)
    for f in destino.iterdir():
        f.unlink()
    copiados = []
    for nome in DB_ARQS:
        if (BACKEND / nome).exists():
            shutil.copy2(BACKEND / nome, destino / nome)
            copiados.append(nome)
    if 'omavest.db' not in copiados:
        raise SystemExit('Backup falhou: pc/backend/omavest.db não encontrado.')
    return copiados


def restaurar_db(origem, copiados):
    # garante que o backup está completo antes de apagar o banco atual
    if not all((origem / n).exists() and (origem / n).stat().st_size >= 0 for n in copiados):
        print('!! backup incompleto, banco NÃO restaurado. Backup em', origem)
        return False
    for tentativa in range(20):
        try:
            for nome in DB_ARQS:                      # apaga também -wal/-shm novos que não existiam no backup
                (BACKEND / nome).unlink(missing_ok=True)
            break
        except PermissionError:
            time.sleep(0.5)
    else:
        print('!! arquivos do banco ainda em uso; restaure manualmente a partir de', origem)
        return False
    for nome in copiados:
        shutil.copy2(origem / nome, BACKEND / nome)
    return True


def main():
    pedidas = [a for a in sys.argv[1:] if a in ORDEM] or ORDEM
    SAIDA.mkdir(exist_ok=True)
    py = sys.executable
    suites = {
        'dados': ['node', str(TESTS / 'compare_data.js')],
        'segredos': ['node', str(TESTS / 'scan_segredos.js')],
        'api': [py, str(TESTS / 'api_checks.py'), str(SAIDA / 'api')],
        'crawl': [py, str(TESTS / 'site_crawl.py'), str(SAIDA / 'site_crawl')],
        'site': [py, str(TESTS / 'site_flows.py'), str(SAIDA / 'site_flows')],
        'app': [py, str(TESTS / 'app_flows.py'), str(SAIDA / 'app_flows'), str(SAIDA / 'site_flows' / 'site_account.json')],
    }
    precisa_servidor = any(s in pedidas for s in ('api', 'crawl', 'site', 'app'))
    servidor = expo = None
    copiados = None
    backup = SAIDA / 'db-backup'
    resultados = {}
    try:
        if precisa_servidor and not porta_aberta(5000):
            copiados = backup_db(backup)
            print(f'Backup do banco: {", ".join(copiados)} -> {backup}')
            print('Subindo o servidor OMAVEST (dotnet run)...')
            log = open(SAIDA / 'servidor.log', 'w', encoding='utf-8')
            servidor = subprocess.Popen(['dotnet', 'run', '-c', 'Release', '--nologo'], cwd=BACKEND, stdout=log, stderr=subprocess.STDOUT)
            if not esperar_url('http://127.0.0.1:5000/api/health', 180):
                raise SystemExit('O servidor não respondeu em 3 minutos (veja tests/_saida/servidor.log).')
        elif precisa_servidor:
            print('!! Servidor já estava rodando: os dados de teste ficarão no banco (não será restaurado).')
        if 'app' in pedidas and not porta_aberta(8081):
            print('Subindo o Expo Web (porta 8081)...')
            log2 = open(SAIDA / 'expo.log', 'w', encoding='utf-8')
            env = {**os.environ, 'CI': '1', 'BROWSER': 'none'}
            expo = subprocess.Popen('npx expo start --web --port 8081', cwd=APPDIR, shell=True, stdout=log2, stderr=subprocess.STDOUT, env=env)
            if not esperar_url('http://localhost:8081', 180):
                raise SystemExit('O Expo não respondeu em 3 minutos (veja tests/_saida/expo.log).')

        for nome in ORDEM:
            if nome not in pedidas:
                continue
            print(f'\n===== {nome} =====')
            t0 = time.time()
            rc = subprocess.run(suites[nome], cwd=TESTS).returncode
            resultados[nome] = (rc, time.time() - t0)
    finally:
        matar(expo)
        if servidor:
            matar(servidor)
            esperar_porta_fechar(5000)
            if copiados:
                print('\nBanco restaurado do backup.' if restaurar_db(backup, copiados) else '')
        if expo:
            esperar_porta_fechar(8081)

    print('\n===== RESUMO =====')
    for nome, (rc, dt) in resultados.items():
        print(f"  {nome:9} {'OK' if rc == 0 else 'FALHAS NOVAS'}  ({dt:.0f}s)")
    print('Detalhes em tests/_saida/<suite>/<suite>.json. "CONHECIDA (item N)" = problema já registrado no RELATORIO-QA.md.')
    sys.exit(1 if any(rc for rc, _ in resultados.values()) else 0)


if __name__ == '__main__':
    main()
