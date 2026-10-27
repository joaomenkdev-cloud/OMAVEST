"""Utilidades compartilhadas pelos testes do OMAVEST."""
import json
import os
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent          # pasta L-hub/
SAIDA_PADRAO = RAIZ / 'tests' / '_saida'
SITE = os.environ.get('OMAVEST_SITE', 'http://localhost:5000')
API = os.environ.get('OMAVEST_API', 'http://127.0.0.1:5000/api')   # 127.0.0.1 evita o atraso do "localhost" no Windows
APP = os.environ.get('OMAVEST_APP', 'http://localhost:8081')

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)


def esperado_simulados():
    """O que site e app devem mostrar, calculado direto de pc/data/simulado-config.json e banco-simulado.json.

    Regra única: questões do simulado = mín(limite da configuração, questões do banco no nível), sem repetir.
    Retorna {matéria: {'q': questões no modo misto, 'min': tempo, 'por_nivel': {nível: questões}}}, na ordem da configuração.
    """
    dados = RAIZ / 'pc' / 'data'
    config = json.loads((dados / 'simulado-config.json').read_text(encoding='utf-8'))
    banco = json.loads((dados / 'banco-simulado.json').read_text(encoding='utf-8'))
    saida = {}
    for m, cfg in config.items():
        qs = banco.get(m, [])
        por_nivel = {n: min(cfg['questoes'], sum(1 for q in qs if q['dificuldade'] == n)) for n in ('Fácil', 'Médio', 'Difícil')}
        saida[m] = {'q': min(cfg['questoes'], len(qs)), 'min': cfg['tempo'], 'por_nivel': por_nivel}
    return saida


class Relatorio:
    """Registra cada verificação.

    - OK: passou.
    - FALHA: problema novo (regressão ou bug não listado) -> o script termina com código 1.
    - CONHECIDA: falhou, mas é um item já registrado no RELATORIO-QA.md (ex.: conhecido='item 4').
    Quando uma verificação marcada como conhecida passa, aparece "OK (item N resolvido)".
    """

    def __init__(self, suite, saida=None):
        self.suite = suite
        self.saida = Path(saida) if saida else SAIDA_PADRAO / suite
        self.saida.mkdir(parents=True, exist_ok=True)
        self.itens = []

    def step(self, area, nome, ok, det='', conhecido=None):
        if ok:
            st = 'OK' if not conhecido else f'OK ({conhecido} resolvido)'
        else:
            st = f'CONHECIDA ({conhecido})' if conhecido else 'FALHA'
        self.itens.append({'area': area, 'verificacao': nome, 'status': st, 'detalhe': str(det)[:400]})
        print(f'[{st}] {area} | {nome} | {str(det)[:300]}', flush=True)
        return ok

    def fim(self):
        (self.saida / f'{self.suite}.json').write_text(json.dumps(self.itens, ensure_ascii=False, indent=1), encoding='utf-8')
        n = lambda pref: sum(1 for i in self.itens if i['status'].startswith(pref))
        resolvidos = [i for i in self.itens if 'resolvido' in i['status']]
        print(f"\nRESUMO {self.suite}: {n('OK')} OK | {n('CONHECIDA')} conhecidas | {n('FALHA')} FALHAS NOVAS")
        for i in resolvidos:
            print(f"  -> {i['status']}: {i['verificacao']}")
        return 1 if n('FALHA') else 0
