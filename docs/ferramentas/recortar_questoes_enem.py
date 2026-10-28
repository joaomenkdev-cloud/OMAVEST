"""Recorta questoes do caderno do ENEM (PDF do INEP) em imagens PNG, com o gabarito.

Requer: pip install pymupdf
Uso:
  python recortar_questoes_enem.py PROVA.pdf GABARITO.pdf pasta_saida prefixo PAGINA_INICIAL
Exemplo (2o dia, caderno 7 azul):
  python recortar_questoes_enem.py 2023_PV_impresso_D2_CD7.pdf 2023_GB_impresso_D2_CD7.pdf saida enem2023 1

Gera um PNG por questao e um JSON com numero, gabarito e texto extraido.
Questoes que continuam em outra coluna/pagina sao ignoradas (o recorte ficaria partido).
PDFs oficiais: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos
"""
import sys, fitz, re, json, os
pdf, gbpdf, outdir, tag, skip_before = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5])
os.makedirs(outdir, exist_ok=True)
# answer key: words "136 B 137 C ..." (handles "Anulado")
gb_words = fitz.open(gbpdf)[0].get_text("words")
gb_words.sort(key=lambda w: (round(w[0]/40), w[1]))
toks = [w[4] for w in fitz.open(gbpdf)[0].get_text("words")]
key = {}
for i, t in enumerate(toks[:-1]):
    if t.isdigit() and 1 <= int(t) <= 180 and toks[i+1] in list("ABCDE") + ["Anulado"]:
        key.setdefault(int(t), toks[i+1])
d = fitz.open(pdf)
markers = []
for pno in range(d.page_count):
    p = d[pno]
    two_col = any(abs(dr["rect"].x0-282) < 4 and dr["rect"].height > 300 for dr in p.get_drawings())
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            t = "".join(s["text"] for s in l["spans"]).strip()
            m = re.match(r"^QUEST\S+\s*(\d+)$", t)
            if m:
                x0, y0, x1, y1 = l["bbox"]
                col = 0 if (not two_col or x0 < 200) else 1
                markers.append(dict(n=int(m.group(1)), page=pno, col=col, y0=y0, y1=y1, two=two_col))
markers.sort(key=lambda m: (m["page"], m["col"], m["y0"]))
markers = [m for m in markers if m["page"] >= skip_before]
res = []
for i, m in enumerate(markers):
    nxt = markers[i+1] if i+1 < len(markers) else None
    if m["two"]:
        x0, x1 = (29, 281) if m["col"] == 0 else (287, 538)
    else:
        x0, x1 = 29, 538
    if nxt and nxt["page"] == m["page"] and nxt["col"] == m["col"]:
        ybot = nxt["y0"] - 4
    elif nxt is None or nxt["y0"] <= 72:
        ybot = 734
    else:
        continue  # question continues in another column: skip
    p = d[m["page"]]
    region = fitz.Rect(x0, m["y1"] + 2, x1, ybot)
    # tighten bottom to real content
    bottoms = []
    for b in p.get_text("dict")["blocks"]:
        r = fitz.Rect(b["bbox"])
        if r.intersects(region) and r.y0 >= region.y0 - 1 and r.y1 <= region.y1 + 1:
            bottoms.append(r.y1)
    for dr in p.get_drawings():
        r = dr["rect"]
        if r.y0 >= region.y0 and r.y1 <= region.y1 and r.x0 >= x0 - 1 and r.x1 <= x1 + 1 and r.height < 600 and not (r.height < 3 and r.width > 180):
            bottoms.append(r.y1)
    if not bottoms:
        continue
    region.y1 = min(region.y1, max(bottoms) + 6)
    text = p.get_text("text", clip=region).strip()
    pix = p.get_pixmap(clip=region, dpi=200)
    fn = f"{tag}-q{m['n']:03d}.png"
    pix.save(os.path.join(outdir, fn))
    res.append(dict(n=m["n"], file=fn, page=m["page"]+1, w=pix.width, h=pix.height, gab=key.get(m["n"]), text=text))
json.dump(res, open(os.path.join(outdir, f"{tag}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(markers), "markers;", len(res), "extracted;", "key size", len(key))
