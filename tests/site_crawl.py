"""Varredura do site: console, requisições com falha, imagens quebradas, transbordo horizontal, tempos e links."""
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

from playwright.sync_api import sync_playwright

from _comum import SITE, Relatorio

R = Relatorio('site_crawl', sys.argv[1] if len(sys.argv) > 1 else None)
BASE = f'{SITE}/html/'
PAGES = ['index', 'inscricao', 'noticias', 'provas', 'cronograma', 'simulados', 'redacao', 'area-candidato', 'faq', 'sobre', 'privacidade', 'termos']
VIEWS = {'desktop': (1440, 900), 'tablet': (768, 1024), 'celular': (375, 812), 'celular-pequeno': (320, 568)}
all_links = set()
tempos = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for vname, (w, h) in VIEWS.items():
        ctx = browser.new_context(viewport={'width': w, 'height': h}, is_mobile=w < 800, has_touch=w < 800)
        for name in PAGES:
            page = ctx.new_page()
            cons, fails, bad = [], [], []
            page.on('console', lambda m: cons.append(f'{m.type}: {m.text[:200]}') if m.type == 'error' else None)
            page.on('pageerror', lambda e: cons.append(f'pageerror: {str(e)[:200]}'))
            page.on('requestfailed', lambda r: fails.append(f'{r.url[:120]} {r.failure}'))
            page.on('response', lambda r: bad.append(f'{r.status} {r.url[:120]}') if r.status >= 400 else None)
            t0 = time.time()
            page.goto(BASE + name + '.html', wait_until='load')
            t_load = time.time() - t0
            try:
                page.wait_for_load_state('networkidle', timeout=10000)
            except Exception:
                pass
            page.wait_for_timeout(500)
            info = page.evaluate('''() => {
                const imgs = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.src).map(i => i.src);
                const sw = document.documentElement.scrollWidth, iw = window.innerWidth;
                return { brokenImgs: imgs, overflow: sw > iw ? `${sw}px > ${iw}px` : null,
                         links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')) };
            }''')
            if vname in ('desktop', 'celular'):
                page.screenshot(path=str(R.saida / f'{vname}-{name}.png'))
            all_links.update((name, l) for l in info['links'])
            tempos.setdefault(name, {})[vname] = round(t_load, 2)
            problemas = {k: v for k, v in {'console': cons, 'requisicoes_falharam': fails, 'http_erro': bad,
                                          'imagens_quebradas': info['brokenImgs'], 'transbordo': info['overflow']}.items() if v}
            R.step('Páginas', f'{name} [{vname} {w}px]', not problemas, problemas or f'carregou em {t_load:.2f}s')
            page.close()
        ctx.close()

    ctx = browser.new_context()
    pg = ctx.new_page()
    for name in PAGES:
        pg.goto(BASE + name + '.html')
        ids = set(pg.evaluate('() => [...document.querySelectorAll("[id]")].map(e => e.id)'))
        quebradas = [l for (src, l) in all_links if src == name and l.startswith('#') and len(l) > 1 and l[1:] not in ids]
        R.step('Âncoras', f'{name}: links #âncora existem', not quebradas, quebradas)
    browser.close()


def check(url):
    try:
        r = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (OMAVEST QA)'})
        with urllib.request.urlopen(r, timeout=15) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        return f'erro {type(e).__name__}'


vistos = {}
for (src, l) in sorted(all_links):
    if l.startswith(('#', 'mailto:', 'tel:', 'javascript:')):
        continue
    url = l if l.startswith('http') else urllib.parse.urljoin(BASE + src + '.html', l)
    if url in vistos:
        continue
    vistos[url] = check(url)
    interno = url.startswith(SITE)
    if interno:
        R.step('Links', f'interno {url.replace(SITE, "")}', vistos[url] == 200, vistos[url])
    elif vistos[url] != 200:
        print(f'[AVISO] link externo respondeu {vistos[url]}: {url} (verifique no navegador)')

print('\nTempo de carregamento (s):')
for name, t in tempos.items():
    print(f"  {name:15} " + ' | '.join(f'{v} {t[v]}' for v in t))
sys.exit(R.fim())
