/* ===========================================================================
   OMAVEST — Apresentação de TCC
   Gera um .pptx profissional (16:9) — paleta verde + amarelo (identidade OMAVEST).
   =========================================================================== */
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Fa = require("react-icons/fa");

// ---------- Paleta oficial OMAVEST (verde escuro + amarelo) ----------
const C = {
  darkBg:  "0F1B17",   // --primary-dark (verde escuro) — capa / encerramento / divisores
  darkBg2: "14241E",   // --dark-mid — ornamentos
  green:   "275E4C",   // --primary (verde) — cor da marca
  greenDk: "14382C",   // verde escuro p/ texto sobre fundos claros
  greenLt: "DCEBE3",   // verde bem claro — chips e círculos de ícone
  blue2:   "3F8D70",   // --primary-light (verde médio) — gráficos
  mint:    "FFD557",   // --accent-light (amarelo claro) — destaque em fundo escuro
  amber:   "DCA60A",   // --accent (dourado) — acento / preenchimento
  goldDk:  "8A6A0A",   // dourado escuro — glifos/textos sobre amarelo claro
  ink:     "1F2E28",   // texto principal (próx. de --text-body)
  muted:   "6E7A74",   // legendas (--text-muted)
  light:   "F5F7F4",   // --cream — fundo dos slides
  white:   "FFFFFF",
  line:    "DDE5E0",   // bordas suaves (azul acinzentado)
};

const FONT_H = "Trebuchet MS";
const FONT_B = "Calibri";
const W = 13.333, H = 7.5;

// ---------- helpers ----------
const mkShadow = () => ({ type: "outer", color: "0F1B17", blur: 9, offset: 3, angle: 90, opacity: 0.20 });
const mkShadowSoft = () => ({ type: "outer", color: "26332E", blur: 7, offset: 2, angle: 90, opacity: 0.13 });

const iconCache = {};
function svgFor(IconComp, color) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, { color, size: "256" })
  );
}
async function icon(name, color) {
  const key = name + "|" + color;
  if (iconCache[key]) return iconCache[key];
  const IconComp = Fa[name];
  if (!IconComp) throw new Error("Ícone não encontrado: " + name);
  const svg = svgFor(IconComp, "#" + color);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const data = "image/png;base64," + png.toString("base64");
  iconCache[key] = data;
  return data;
}

let pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: W, height: H });
pres.layout = "WIDE";
pres.author = "Grupo OMAVEST";
pres.title = "OMAVEST — TCC";

let pageNo = 0;
function footer(slide, dark = false) {
  pageNo++;
  const col = dark ? "8FA39A" : C.muted;
  slide.addText("OMAVEST  ·  Trabalho de Conclusão de Curso", {
    x: 0.55, y: 7.04, w: 7, h: 0.32, fontFace: FONT_B, fontSize: 9, color: col, align: "left",
  });
  slide.addText(String(pageNo).padStart(2, "0") + " / 15", {
    x: 11.8, y: 7.04, w: 0.98, h: 0.32, fontFace: FONT_B, fontSize: 9, color: col, align: "right",
  });
}

// kicker + título padrão (slides claros)
function header(slide, kicker, titleText) {
  slide.addText(kicker.toUpperCase(), {
    x: 0.6, y: 0.42, w: 11, h: 0.32, fontFace: FONT_H, fontSize: 12.5, bold: true,
    color: C.green, charSpacing: 3, align: "left",
  });
  slide.addText(titleText, {
    x: 0.58, y: 0.74, w: 12.1, h: 0.95, fontFace: FONT_H, fontSize: 32, bold: true,
    color: C.ink, align: "left", margin: 0,
  });
}

async function iconChip(slide, x, y, d, iconName, circleColor, glyphColor) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: circleColor }, line: { type: "none" } });
  const pad = d * 0.27;
  slide.addImage({ data: await icon(iconName, glyphColor), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
}

// ===========================================================================
async function build() {

  // ---------------------------------------------------------------- SLIDE 1 — CAPA
  let s = pres.addSlide();
  s.background = { color: C.darkBg };
  // ornamentos
  s.addShape(pres.shapes.OVAL, { x: 10.1, y: -2.0, w: 6.2, h: 6.2, fill: { color: C.darkBg2 }, line: { type: "none" } });
  s.addShape(pres.shapes.OVAL, { x: 11.6, y: 3.9, w: 4.6, h: 4.6, fill: { color: C.green }, line: { type: "none" } });
  s.addShape(pres.shapes.OVAL, { x: -1.6, y: 5.0, w: 4.2, h: 4.2, fill: { color: C.darkBg2 }, line: { type: "none" } });
  // selo
  s.addImage({ path: __dirname + "/images/logo-omavest-escuro.png", x: 0.85, y: 0.55, w: 1.5, h: 1.36 });
  s.addText("PREPARAÇÃO PARA VESTIBULARES", {
    x: 2.6, y: 0.92, w: 8, h: 0.5, fontFace: FONT_H, fontSize: 16, bold: true, color: C.mint, charSpacing: 2,
  });
  // título principal
  s.addText("Plataforma integrada de\ngestão do vestibular e\npreparação do candidato", {
    x: 0.85, y: 2.35, w: 9.4, h: 2.6, fontFace: FONT_H, fontSize: 40, bold: true, color: C.white, lineSpacingMultiple: 1.02,
  });
  s.addText("Uma solução web e mobile que digitaliza todo o processo seletivo — da inscrição ao resultado — e aproxima a instituição do estudante.", {
    x: 0.9, y: 5.05, w: 8.7, h: 0.9, fontFace: FONT_B, fontSize: 15, color: "CFE6DB",
  });
  // rodapé de autoria
  s.addShape(pres.shapes.LINE, { x: 0.9, y: 6.15, w: 8.4, h: 0, line: { color: C.green, width: 1.5 } });
  s.addText([
    { text: "Integrantes:  ", options: { bold: true, color: C.mint } },
    { text: "[Nome 1]  ·  [Nome 2]  ·  [Nome 3]  ·  [Nome 4]", options: { color: "CFE6DB" } },
  ], { x: 0.9, y: 6.3, w: 11.6, h: 0.35, fontFace: FONT_B, fontSize: 13 });
  s.addText([
    { text: "Orientador(a): [Nome]      ", options: { color: "8FA39A" } },
    { text: "[Curso] — [Instituição] — [Cidade / 2026]", options: { color: "8FA39A" } },
  ], { x: 0.9, y: 6.68, w: 11.6, h: 0.35, fontFace: FONT_B, fontSize: 12 });

  // ---------------------------------------------------------------- SLIDE 2 — AGENDA
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "Roteiro da apresentação", "O que vamos mostrar");
  const agendaItems = [
    { n: "01", t: "Problema & objetivos", who: "Apresentador 1", ic: "FaBullseye" },
    { n: "02", t: "A solução & o mercado", who: "Apresentador 2", ic: "FaStore" },
    { n: "03", t: "Tecnologia & arquitetura", who: "Apresentador 3", ic: "FaServer" },
    { n: "04", t: "Resultados & conclusão", who: "Apresentador 4", ic: "FaChartLine" },
  ];
  let ax = 0.6, ay = 2.1, aw = 5.95, ah = 2.05, agx = 0.23, agy = 0.22;
  for (let i = 0; i < agendaItems.length; i++) {
    const it = agendaItems[i];
    const cx = ax + (i % 2) * (aw + agx);
    const cy = ay + Math.floor(i / 2) * (ah + agy);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: cy, w: aw, h: ah, fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.1, shadow: mkShadowSoft() });
    s.addText(it.n, { x: cx + 0.35, y: cy + 0.32, w: 1.4, h: 1.4, fontFace: FONT_H, fontSize: 46, bold: true, color: C.greenLt, valign: "middle" });
    await iconChip(s, cx + aw - 1.4, cy + 0.42, 0.95, it.ic, C.greenLt, C.green);
    s.addText(it.t, { x: cx + 1.55, y: cy + 0.5, w: aw - 3.0, h: 0.9, fontFace: FONT_H, fontSize: 19, bold: true, color: C.ink, valign: "middle" });
    s.addText(it.who, { x: cx + 1.55, y: cy + 1.32, w: aw - 3.0, h: 0.4, fontFace: FONT_B, fontSize: 12.5, color: C.green, bold: true });
  }
  footer(s);

  // ---------------------------------------------------------------- SLIDE 3 — PROBLEMA
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "Contexto & problema", "Por que o vestibular ainda dói?");
  s.addText("Milhares de instituições privadas no Brasil realizam o próprio vestibular — quase sempre com processos manuais e ferramentas desconectadas.", {
    x: 0.6, y: 1.72, w: 12.1, h: 0.7, fontFace: FONT_B, fontSize: 15, color: C.muted,
  });
  const probs = [
    { ic: "FaFileAlt", t: "Processos no papel", d: "Inscrição em planilha, comunicação solta por e-mail e edital impresso." },
    { ic: "FaMoneyBillWave", t: "Banca é cara", d: "Contratar uma organizadora (Vunesp, Cebraspe) é inviável para faculdades pequenas." },
    { ic: "FaPuzzlePiece", t: "Tudo fragmentado", d: "Pagamento, locais de prova e resultados vivem em sistemas separados." },
    { ic: "FaUserSlash", t: "Candidato perdido", d: "A preparação fica dispersa em vários sites, sem ligação com o processo." },
  ];
  let px = 0.6, py = 2.55, pw = 2.92, ph = 3.55, pgx = 0.21;
  for (let i = 0; i < probs.length; i++) {
    const p = probs[i]; const cx = px + i * (pw + pgx);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: py, w: pw, h: ph, fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.1, shadow: mkShadowSoft() });
    await iconChip(s, cx + 0.4, py + 0.42, 1.0, p.ic, "FFF3CC", C.goldDk);
    s.addText(p.t, { x: cx + 0.32, y: py + 1.6, w: pw - 0.64, h: 0.55, fontFace: FONT_H, fontSize: 17, bold: true, color: C.ink });
    s.addText(p.d, { x: cx + 0.32, y: py + 2.2, w: pw - 0.64, h: 1.2, fontFace: FONT_B, fontSize: 12.5, color: C.muted, lineSpacingMultiple: 1.05 });
  }
  footer(s);

  // ---------------------------------------------------------------- SLIDE 4 — OBJETIVOS
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "Objetivos do projeto", "O que precisávamos entregar");
  // objetivo geral - faixa destacada
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.8, w: 12.13, h: 1.35, fill: { color: C.darkBg }, line: { type: "none" }, rectRadius: 0.1, shadow: mkShadow() });
  await iconChip(s, 0.95, 2.13, 0.78, "FaBullseye", C.mint, C.darkBg);
  s.addText("OBJETIVO GERAL", { x: 2.0, y: 1.98, w: 9, h: 0.3, fontFace: FONT_H, fontSize: 12, bold: true, color: C.mint, charSpacing: 2 });
  s.addText("Desenvolver uma plataforma web e mobile que centralize a gestão do processo seletivo e a preparação do candidato em um único ecossistema.", {
    x: 2.0, y: 2.3, w: 10.3, h: 0.8, fontFace: FONT_B, fontSize: 15.5, color: C.white, bold: true, valign: "top",
  });
  s.addText("OBJETIVOS ESPECÍFICOS", { x: 0.62, y: 3.45, w: 9, h: 0.32, fontFace: FONT_H, fontSize: 12.5, bold: true, color: C.green, charSpacing: 2 });
  const espec = [
    { ic: "FaCogs", t: "Automatizar inscrição, pagamento, locais de prova, resultados e comunicação." },
    { ic: "FaClipboardCheck", t: "Oferecer simulados interativos e um banco de provas anteriores." },
    { ic: "FaMoneyBillWave", t: "Reduzir o trabalho manual e o custo de operação da instituição." },
    { ic: "FaMobileAlt", t: "Disponibilizar acesso pelo celular, inclusive sem internet." },
  ];
  let ex = 0.6, ey = 3.95, ew = 5.98, eh = 1.28, egx = 0.17, egy = 0.18;
  for (let i = 0; i < espec.length; i++) {
    const e = espec[i];
    const cx = ex + (i % 2) * (ew + egx);
    const cy = ey + Math.floor(i / 2) * (eh + egy);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: cy, w: ew, h: eh, fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.08, shadow: mkShadowSoft() });
    await iconChip(s, cx + 0.3, cy + 0.31, 0.66, e.ic, C.greenLt, C.green);
    s.addText(e.t, { x: cx + 1.2, y: cy + 0.18, w: ew - 1.5, h: eh - 0.36, fontFace: FONT_B, fontSize: 13.5, color: C.ink, valign: "middle", lineSpacingMultiple: 1.02 });
  }
  footer(s);

  // ---------------------------------------------------------------- SLIDE 5 — A SOLUÇÃO / JORNADA
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "A solução", "OMAVEST: dois mundos em uma plataforma");
  // dois selos: instituição + candidato
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.8, w: 5.96, h: 1.25, fill: { color: C.greenLt }, line: { type: "none" }, rectRadius: 0.1 });
  await iconChip(s, 0.9, 2.06, 0.72, "FaUniversity", C.green, C.white);
  s.addText([{ text: "Lado da instituição\n", options: { bold: true, fontSize: 15, color: C.greenDk } }, { text: "Gestão completa do processo seletivo", options: { fontSize: 12, color: C.greenDk } }], { x: 1.78, y: 1.9, w: 4.6, h: 1.05, fontFace: FONT_B, valign: "middle" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.77, y: 1.8, w: 5.96, h: 1.25, fill: { color: "FFF3CC" }, line: { type: "none" }, rectRadius: 0.1 });
  await iconChip(s, 7.07, 2.06, 0.72, "FaUserGraduate", C.amber, C.darkBg);
  s.addText([{ text: "Lado do candidato\n", options: { bold: true, fontSize: 15, color: "8A6A0A" } }, { text: "Estudo, acompanhamento e resultado", options: { fontSize: 12, color: "8A6A0A" } }], { x: 7.95, y: 1.9, w: 4.6, h: 1.05, fontFace: FONT_B, valign: "middle" });

  s.addText("A JORNADA DO CANDIDATO, DE PONTA A PONTA", { x: 0.62, y: 3.45, w: 11, h: 0.32, fontFace: FONT_H, fontSize: 12.5, bold: true, color: C.green, charSpacing: 2 });
  const steps = [
    { ic: "FaFileSignature", t: "Inscrição" },
    { ic: "FaCreditCard", t: "Pagamento" },
    { ic: "FaBookOpen", t: "Estudo + IA" },
    { ic: "FaMapMarkerAlt", t: "Local de prova" },
    { ic: "FaTrophy", t: "Resultado" },
  ];
  const n = steps.length;
  const jy = 4.55, dd = 1.25;
  const startX = 0.95, endX = 12.4;
  const gap = (endX - startX - dd) / (n - 1);
  // linha base
  s.addShape(pres.shapes.LINE, { x: startX + dd / 2, y: jy + dd / 2, w: (n - 1) * gap, h: 0, line: { color: C.green, width: 2, dashType: "dash" } });
  for (let i = 0; i < n; i++) {
    const cx = startX + i * gap;
    await iconChip(s, cx, jy, dd, steps[i].ic, i % 2 === 0 ? C.green : C.amber, i % 2 === 0 ? C.white : C.darkBg);
    s.addShape(pres.shapes.OVAL, { x: cx + dd - 0.42, y: jy - 0.04, w: 0.46, h: 0.46, fill: { color: C.amber }, line: { color: C.white, width: 1.5 } });
    s.addText(String(i + 1), { x: cx + dd - 0.42, y: jy - 0.04, w: 0.46, h: 0.46, fontFace: FONT_H, fontSize: 13, bold: true, color: C.white, align: "center", valign: "middle" });
    s.addText(steps[i].t, { x: cx - 0.5, y: jy + dd + 0.08, w: dd + 1.0, h: 0.5, fontFace: FONT_H, fontSize: 13.5, bold: true, color: C.ink, align: "center" });
  }
  footer(s);

  // ---------------------------------------------------------------- SLIDE 6 — MERCADO (QUADRANTE)
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "Posicionamento de mercado", "Onde o OMAVEST se encaixa");
  // texto à esquerda
  const mkt = [
    { b: "Setor:", t: " EdTech + gestão acadêmica (modelo vertical SaaS)." },
    { b: "Hoje o mercado se divide:", t: " bancas organizadoras (caras, p/ grandes volumes) e plataformas de preparação (focadas só no aluno)." },
    { b: "O nicho desatendido:", t: " faculdades pequenas e médias que precisam organizar o próprio vestibular sem contratar uma banca." },
    { b: "O OMAVEST ocupa esse espaço", t: " unindo gestão institucional e preparação do aluno — acessível e em um só lugar." },
  ];
  // intro
  s.addText("O OMAVEST atua na intersecção entre EdTech e gestão acadêmica — um espaço que hoje nenhuma solução cobre por completo.", {
    x: 0.6, y: 1.72, w: 12.1, h: 0.55, fontFace: FONT_B, fontSize: 15, color: C.muted,
  });
  // texto em largura cheia (sem gráfico)
  let my = 2.5;
  const rowH = 1.0, rowGap = 0.08;
  for (let i = 0; i < mkt.length; i++) {
    const m = mkt[i];
    const accent = i === 3 ? C.amber : C.green;
    s.addText("0" + (i + 1), { x: 0.6, y: my, w: 1.0, h: rowH, fontFace: FONT_H, fontSize: 30, bold: true, color: C.greenLt, valign: "middle", align: "left" });
    s.addShape(pres.shapes.RECTANGLE, { x: 1.62, y: my + 0.1, w: 0.07, h: rowH - 0.2, fill: { color: accent }, line: { type: "none" } });
    s.addText([{ text: m.b, options: { bold: true, color: accent } }, { text: m.t, options: { color: C.ink } }], { x: 1.92, y: my, w: 10.7, h: rowH, fontFace: FONT_B, fontSize: 16, valign: "middle", lineSpacingMultiple: 1.02 });
    my += rowH + rowGap;
  }
  footer(s);

  // ---------------------------------------------------------------- SLIDE 7 — PROPOSTA DE VALOR
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "Proposta de valor", "O que o OMAVEST facilita");
  // coluna instituição
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.85, w: 5.96, h: 4.85, fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.08, shadow: mkShadowSoft() });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.85, w: 5.96, h: 0.95, fill: { color: C.darkBg }, line: { type: "none" }, rectRadius: 0.08 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.4, w: 5.96, h: 0.4, fill: { color: C.darkBg }, line: { type: "none" } });
  await iconChip(s, 0.9, 2.0, 0.65, "FaUniversity", C.mint, C.darkBg);
  s.addText("Para a INSTITUIÇÃO", { x: 1.7, y: 1.85, w: 4.7, h: 0.95, fontFace: FONT_H, fontSize: 17, bold: true, color: C.white, valign: "middle" });
  const valInst = [
    "Menos trabalho manual e zero papel",
    "Custo baixo vs. contratar uma banca",
    "Resultados e comunicação centralizados",
    "Painel administrativo único",
    "Importação de provas sem digitação",
  ];
  s.addText(valInst.map((t, i) => ({ text: t, options: { bullet: { code: "2713" }, breakLine: true, color: C.ink, paraSpaceAfter: 10 } })), {
    x: 1.0, y: 3.05, w: 5.2, h: 3.4, fontFace: FONT_B, fontSize: 14, valign: "top",
  });
  // coluna candidato
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.77, y: 1.85, w: 5.96, h: 4.85, fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.08, shadow: mkShadowSoft() });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.77, y: 1.85, w: 5.96, h: 0.95, fill: { color: C.amber }, line: { type: "none" }, rectRadius: 0.08 });
  s.addShape(pres.shapes.RECTANGLE, { x: 6.77, y: 2.4, w: 5.96, h: 0.4, fill: { color: C.amber }, line: { type: "none" } });
  await iconChip(s, 7.07, 2.0, 0.65, "FaUserGraduate", C.white, C.amber);
  s.addText("Para o CANDIDATO", { x: 7.87, y: 1.85, w: 4.7, h: 0.95, fontFace: FONT_H, fontSize: 17, bold: true, color: C.darkBg, valign: "middle" });
  const valCand = [
    "Inscrição e pagamento em minutos",
    "Simulados + provas anteriores + tutor IA",
    "Acompanha cronograma, local e resultado",
    "Comprovante e comunicados no mesmo lugar",
    "Aplicativo no celular, mesmo sem internet",
  ];
  s.addText(valCand.map((t) => ({ text: t, options: { bullet: { code: "2713" }, breakLine: true, color: C.ink, paraSpaceAfter: 10 } })), {
    x: 7.17, y: 3.05, w: 5.2, h: 3.4, fontFace: FONT_B, fontSize: 14, valign: "top",
  });
  footer(s);

  // ---------------------------------------------------------------- SLIDE 8 — FUNCIONALIDADES
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "Funcionalidades", "O que a plataforma entrega");
  const feats = [
    { ic: "FaFileSignature", t: "Inscrição + boleto", d: "Cadastro completo, cotas e pagamento" },
    { ic: "FaUserLock", t: "Área do candidato", d: "Login seguro e dashboard" },
    { ic: "FaClipboardCheck", t: "Simulados", d: "Quiz interativo com correção" },
    { ic: "FaFilePdf", t: "Provas anteriores", d: "ENEM, FUVEST e UNICAMP" },
    { ic: "FaRobot", t: "Tutor com IA", d: "Explica questões como um professor" },
    { ic: "FaCalendarAlt", t: "Cronograma", d: "Timeline de eventos do processo" },
    { ic: "FaNewspaper", t: "Notícias & editais", d: "Comunicados oficiais" },
    { ic: "FaMapMarkedAlt", t: "Locais & resultados", d: "Sala, mesa e classificação" },
  ];
  let fx = 0.6, fy = 1.95, fw = 2.92, fh = 2.18, fgx = 0.21, fgy = 0.2;
  for (let i = 0; i < feats.length; i++) {
    const f = feats[i];
    const ccx = fx + (i % 4) * (fw + fgx);
    const ccy = fy + Math.floor(i / 4) * (fh + fgy);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ccx, y: ccy, w: fw, h: fh, fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.09, shadow: mkShadowSoft() });
    s.addShape(pres.shapes.RECTANGLE, { x: ccx, y: ccy, w: fw, h: 0.12, fill: { color: i % 2 === 0 ? C.green : C.amber }, line: { type: "none" } });
    await iconChip(s, ccx + 0.34, ccy + 0.4, 0.85, f.ic, i % 2 === 0 ? C.greenLt : "FFF3CC", i % 2 === 0 ? C.green : C.goldDk);
    s.addText(f.t, { x: ccx + 0.32, y: ccy + 1.32, w: fw - 0.6, h: 0.45, fontFace: FONT_H, fontSize: 15.5, bold: true, color: C.ink });
    s.addText(f.d, { x: ccx + 0.32, y: ccy + 1.72, w: fw - 0.6, h: 0.42, fontFace: FONT_B, fontSize: 11.5, color: C.muted });
  }
  footer(s);

  // ---------------------------------------------------------------- SLIDE 9 — ARQUITETURA
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "Arquitetura da solução", "Como as peças se conectam");
  function archBox(x, y, w, h, ic, title, sub, fill, glyphCircle, glyphColor, titleColor, subColor) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: C.line, width: 1 }, rectRadius: 0.1, shadow: mkShadowSoft() });
    return iconChip(s, x + 0.3, y + (h - 0.8) / 2, 0.8, ic, glyphCircle, glyphColor).then(() => {
      s.addText([{ text: title + "\n", options: { bold: true, fontSize: 15, color: titleColor } }, { text: sub, options: { fontSize: 11.5, color: subColor } }], { x: x + 1.25, y: y, w: w - 1.45, h, fontFace: FONT_B, valign: "middle", lineSpacingMultiple: 1.0 });
    });
  }
  // linhas conectoras (desenhar antes das caixas)
  s.addShape(pres.shapes.LINE, { x: 3.65, y: 3.05, w: 0, h: 0.55, line: { color: C.green, width: 2 } });
  s.addShape(pres.shapes.LINE, { x: 9.7, y: 3.05, w: 0, h: 0.55, line: { color: C.green, width: 2 } });
  s.addShape(pres.shapes.LINE, { x: 3.65, y: 3.6, w: 6.05, h: 0, line: { color: C.green, width: 2 } });
  s.addShape(pres.shapes.LINE, { x: 6.67, y: 3.6, w: 0, h: 0.85, line: { color: C.green, width: 2 } });
  s.addShape(pres.shapes.LINE, { x: 3.65, y: 5.55, w: 0, h: 0.5, line: { color: C.muted, width: 2, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: 9.7, y: 5.55, w: 0, h: 0.5, line: { color: C.muted, width: 2, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: 3.65, y: 6.05, w: 6.05, h: 0, line: { color: C.muted, width: 2, dashType: "dash" } });
  // topo: clientes
  await archBox(1.55, 1.95, 4.2, 1.1, "FaDesktop", "Site Web", "HTML · CSS · JS (Firebase opcional)", C.white, C.greenLt, C.green, C.ink, C.muted);
  await archBox(7.6, 1.95, 4.2, 1.1, "FaMobileAlt", "App Android", "React Native (Expo) · offline", C.white, C.greenLt, C.green, C.ink, C.muted);
  // meio: API
  await archBox(3.65, 4.45, 6.05, 1.1, "FaServer", "API REST — ASP.NET Core (.NET 10)", "Camadas: Controllers → Services · Swagger", C.darkBg, C.mint, C.darkBg, C.white, "CFE6DB");
  // base: BD + serviços
  await archBox(1.55, 6.05, 4.2, 1.0, "FaDatabase", "Banco SQLite", "Entity Framework Core", C.white, C.greenLt, C.green, C.ink, C.muted);
  await archBox(7.6, 6.05, 4.2, 1.0, "FaCloud", "Serviços externos", "Groq (IA) · PdfPig (PDF)", C.white, "FFF3CC", C.goldDk, C.ink, C.muted);
  footer(s);

  // ---------------------------------------------------------------- SLIDE 10 — STACK
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "Stack tecnológica", "As escolhas e o porquê");
  const stack = [
    { ic: "FaCode", t: ".NET 10 / C#", d: "API robusta, tipada e performática para o back-end." },
    { ic: "FaDatabase", t: "SQLite + EF Core", d: "Banco sem servidor: custo zero de operação e fácil de implantar." },
    { ic: "FaMobileAlt", t: "React Native + Expo", d: "Um só código gera o aplicativo Android nativo." },
    { ic: "FaFire", t: "Firebase (opcional)", d: "Login com Google e verificação em 2 etapas (2FA)." },
    { ic: "FaLayerGroup", t: "Arquitetura em camadas", d: "Controllers → Services → DbContext: organização e manutenção." },
    { ic: "FaBook", t: "Swagger / OpenAPI", d: "Documentação interativa de todos os endpoints da API." },
  ];
  let sx = 0.6, sy = 1.95, sw = 5.98, sh = 1.42, sgx = 0.17, sgy = 0.18;
  for (let i = 0; i < stack.length; i++) {
    const st = stack[i];
    const ccx = sx + (i % 2) * (sw + sgx);
    const ccy = sy + Math.floor(i / 2) * (sh + sgy);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ccx, y: ccy, w: sw, h: sh, fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.09, shadow: mkShadowSoft() });
    await iconChip(s, ccx + 0.32, ccy + (sh - 0.85) / 2, 0.85, st.ic, C.greenLt, C.green);
    s.addText([{ text: st.t + "\n", options: { bold: true, fontSize: 15.5, color: C.ink } }, { text: st.d, options: { fontSize: 12, color: C.muted } }], { x: ccx + 1.32, y: ccy, w: sw - 1.55, h: sh, fontFace: FONT_B, valign: "middle", lineSpacingMultiple: 1.02 });
  }
  footer(s);

  // ---------------------------------------------------------------- SLIDE 11 — DESTAQUES TÉCNICOS
  s = pres.addSlide(); s.background = { color: C.darkBg };
  s.addShape(pres.shapes.OVAL, { x: 10.6, y: -1.8, w: 5.2, h: 5.2, fill: { color: C.darkBg2 }, line: { type: "none" } });
  s.addText("DIFERENCIAIS TÉCNICOS", { x: 0.6, y: 0.5, w: 11, h: 0.32, fontFace: FONT_H, fontSize: 12.5, bold: true, color: C.mint, charSpacing: 3 });
  s.addText("Os três trunfos do projeto", { x: 0.58, y: 0.82, w: 12, h: 0.9, fontFace: FONT_H, fontSize: 32, bold: true, color: C.white });
  const hl = [
    { ic: "FaFilePdf", t: "Importação de provas por PDF", d: "Extrai questões e alternativas de PDFs oficiais (ENEM, FUVEST, UNICAMP) com a biblioteca PdfPig + regex — populando o banco sem digitação manual." },
    { ic: "FaRobot", t: "Tutor com Inteligência Artificial", d: "Integração com a Groq (Llama 3.3 70B, Llama 3.1, Gemma2) com fallback automático entre modelos para explicar questões de forma didática." },
    { ic: "FaWifi", t: "Aplicativo que funciona offline", d: "Cache local com expiração (AsyncStorage) mantém dados essenciais disponíveis mesmo sem conexão com a internet." },
  ];
  let hx = 0.6, hy = 2.05, hw = 3.92, hh = 4.55, hgx = 0.2;
  for (let i = 0; i < hl.length; i++) {
    const h2 = hl[i]; const ccx = hx + i * (hw + hgx);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ccx, y: hy, w: hw, h: hh, fill: { color: C.white }, line: { type: "none" }, rectRadius: 0.1, shadow: mkShadow() });
    s.addText("0" + (i + 1), { x: ccx + 0.35, y: hy + 0.28, w: 2, h: 0.8, fontFace: FONT_H, fontSize: 34, bold: true, color: C.greenLt });
    await iconChip(s, ccx + hw - 1.35, hy + 0.45, 0.95, h2.ic, C.darkBg, C.mint);
    s.addText(h2.t, { x: ccx + 0.38, y: hy + 1.45, w: hw - 0.7, h: 1.0, fontFace: FONT_H, fontSize: 18, bold: true, color: C.ink, valign: "top" });
    s.addText(h2.d, { x: ccx + 0.38, y: hy + 2.45, w: hw - 0.7, h: 1.9, fontFace: FONT_B, fontSize: 12.5, color: C.muted, valign: "top", lineSpacingMultiple: 1.08 });
  }
  footer(s, true);

  // ---------------------------------------------------------------- SLIDE 12 — SEGURANÇA
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "Segurança & dados", "Privacidade levada a sério");
  const sec = [
    { ic: "FaKey", t: "Senhas com hash SHA-256", d: "Nunca armazenadas em texto puro." },
    { ic: "FaShieldAlt", t: "Autenticação por token", d: "Tokens com expiração e validação por requisição." },
    { ic: "FaUserShield", t: "Controle de acesso", d: "Candidato só enxerga os próprios dados (bloqueio 403)." },
    { ic: "FaLock", t: "Credenciais fora do código", d: "Variáveis de ambiente e arquivos .example." },
  ];
  let kx = 0.6, ky = 2.0, kw = 5.98, kh = 1.95, kgx = 0.17, kgy = 0.2;
  for (let i = 0; i < sec.length; i++) {
    const se = sec[i];
    const ccx = kx + (i % 2) * (kw + kgx);
    const ccy = ky + Math.floor(i / 2) * (kh + kgy);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ccx, y: ccy, w: kw, h: kh, fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.09, shadow: mkShadowSoft() });
    await iconChip(s, ccx + 0.35, ccy + (kh - 1.0) / 2, 1.0, se.ic, C.greenLt, C.green);
    s.addText([{ text: se.t + "\n", options: { bold: true, fontSize: 16, color: C.ink } }, { text: se.d, options: { fontSize: 12.5, color: C.muted } }], { x: ccx + 1.55, y: ccy, w: kw - 1.8, h: kh, fontFace: FONT_B, valign: "middle", lineSpacingMultiple: 1.05 });
  }
  s.addText([{ text: "Conformidade com a LGPD ", options: { bold: true, color: C.greenDk } }, { text: "considerada desde o início do projeto.", options: { color: C.greenDk } }], { x: 0.6, y: 6.35, w: 12.1, h: 0.4, fontFace: FONT_B, fontSize: 13, align: "center" });
  footer(s);

  // ---------------------------------------------------------------- SLIDE 13 — RESULTADOS
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "Resultados alcançados", "O que foi efetivamente entregue");
  // 3 stat callouts
  const stats = [
    { n: "+2.500", l: "linhas de código\nno back-end (C#)" },
    { n: "+30", l: "endpoints REST\ndocumentados" },
    { n: "14", l: "entidades de\ndados modeladas" },
  ];
  let stx = 0.6, sty = 1.95, stw = 3.0, sth = 1.95, stg = 0.25;
  for (let i = 0; i < stats.length; i++) {
    const ccx = stx + i * (stw + stg);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ccx, y: sty, w: stw, h: sth, fill: { color: C.darkBg }, line: { type: "none" }, rectRadius: 0.1, shadow: mkShadow() });
    s.addText(stats[i].n, { x: ccx, y: sty + 0.2, w: stw, h: 0.95, fontFace: FONT_H, fontSize: 40, bold: true, color: C.mint, align: "center" });
    s.addText(stats[i].l, { x: ccx, y: sty + 1.18, w: stw, h: 0.65, fontFace: FONT_B, fontSize: 12, color: "CFE6DB", align: "center", lineSpacingMultiple: 0.95 });
  }
  // texto entregue
  s.addText([
    { text: "Plataforma funcional de ponta a ponta", options: { bullet: { code: "2713" }, breakLine: true, bold: true, color: C.ink, paraSpaceAfter: 8 } },
    { text: "Web + API + aplicativo Android empacotado (EAS Build)", options: { bullet: { code: "2713" }, breakLine: true, color: C.ink, paraSpaceAfter: 8 } },
    { text: "Banco populado com provas e questões reais importadas de PDF", options: { bullet: { code: "2713" }, breakLine: true, color: C.ink, paraSpaceAfter: 8 } },
    { text: "Tutor com IA integrado e funcionando", options: { bullet: { code: "2713" }, color: C.ink } },
  ], { x: 0.7, y: 4.25, w: 6.0, h: 2.4, fontFace: FONT_B, fontSize: 14, valign: "top" });
  // gráfico
  s.addText("ENTREGÁVEIS DO PROJETO", { x: 6.95, y: 4.05, w: 6, h: 0.3, fontFace: FONT_H, fontSize: 11.5, bold: true, color: C.green, charSpacing: 2 });
  s.addChart(pres.charts.BAR, [{
    name: "Quantidade", labels: ["Endpoints", "Entidades", "Telas web", "Telas app"], values: [32, 14, 12, 6],
  }], {
    x: 6.85, y: 4.3, w: 5.9, h: 2.45, barDir: "col",
    chartColors: [C.green, C.blue2, C.amber, C.mint],
    chartArea: { fill: { color: C.light } }, plotArea: { fill: { color: C.light } },
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: C.ink, dataLabelFontFace: FONT_B, dataLabelFontSize: 11, dataLabelFontBold: true,
    catAxisLabelColor: C.muted, catAxisLabelFontFace: FONT_B, catAxisLabelFontSize: 11,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: false, showTitle: false, barGapWidthPct: 55,
  });
  footer(s);

  // ---------------------------------------------------------------- SLIDE 15 — DESAFIOS & FUTURO
  s = pres.addSlide(); s.background = { color: C.light };
  header(s, "Desafios & próximos passos", "O que aprendemos e o que vem aí");
  // desafios
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.95, w: 5.96, h: 4.7, fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.09, shadow: mkShadowSoft() });
  await iconChip(s, 0.95, 2.25, 0.78, "FaExclamationTriangle", "FFF3CC", C.goldDk);
  s.addText("Desafios & aprendizados", { x: 1.85, y: 2.25, w: 4.5, h: 0.78, fontFace: FONT_H, fontSize: 17, bold: true, color: C.ink, valign: "middle" });
  s.addText([
    { text: "Padronizar a extração de PDFs com layouts diferentes", options: { bullet: true, breakLine: true, color: C.ink, paraSpaceAfter: 12 } },
    { text: "Limites de requisição da IA — resolvido com fallback de modelos", options: { bullet: true, breakLine: true, color: C.ink, paraSpaceAfter: 12 } },
    { text: "Sincronização de dados no modo offline do app", options: { bullet: true, breakLine: true, color: C.ink, paraSpaceAfter: 12 } },
    { text: "Integração entre web, mobile e uma API única", options: { bullet: true, color: C.ink } },
  ], { x: 1.0, y: 3.25, w: 5.3, h: 3.2, fontFace: FONT_B, fontSize: 13.5, valign: "top" });
  // futuro
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.77, y: 1.95, w: 5.96, h: 4.7, fill: { color: C.darkBg }, line: { type: "none" }, rectRadius: 0.09, shadow: mkShadow() });
  await iconChip(s, 7.12, 2.25, 0.78, "FaRocket", C.mint, C.darkBg);
  s.addText("Trabalhos futuros", { x: 8.02, y: 2.25, w: 4.5, h: 0.78, fontFace: FONT_H, fontSize: 17, bold: true, color: C.white, valign: "middle" });
  s.addText([
    { text: "Pagamento real via gateway / PIX", options: { bullet: true, breakLine: true, color: "DDEBE3", paraSpaceAfter: 12 } },
    { text: "Versão iOS do aplicativo", options: { bullet: true, breakLine: true, color: "DDEBE3", paraSpaceAfter: 12 } },
    { text: "Painel de relatórios e analytics para a instituição", options: { bullet: true, breakLine: true, color: "DDEBE3", paraSpaceAfter: 12 } },
    { text: "Correção de redação por IA", options: { bullet: true, breakLine: true, color: "DDEBE3", paraSpaceAfter: 12 } },
    { text: "Suporte multi-instituição (multi-tenant / white-label)", options: { bullet: true, color: "DDEBE3" } },
  ], { x: 7.17, y: 3.25, w: 5.3, h: 3.2, fontFace: FONT_B, fontSize: 13.5, valign: "top" });
  footer(s);

  // ---------------------------------------------------------------- SLIDE 16 — CONCLUSÃO
  s = pres.addSlide(); s.background = { color: C.darkBg };
  s.addShape(pres.shapes.OVAL, { x: -2.0, y: -2.2, w: 6.5, h: 6.5, fill: { color: C.darkBg2 }, line: { type: "none" } });
  s.addShape(pres.shapes.OVAL, { x: 10.8, y: 4.0, w: 5.4, h: 5.4, fill: { color: C.green }, line: { type: "none" } });
  s.addImage({ path: __dirname + "/images/logo-omavest-escuro.png", x: 5.85, y: 0.7, w: 1.65, h: 1.5 });
  s.addText("CONCLUSÃO", { x: 0, y: 2.35, w: W, h: 0.4, fontFace: FONT_H, fontSize: 14, bold: true, color: C.mint, charSpacing: 4, align: "center" });
  s.addText("O OMAVEST entrega uma solução integrada,\nde baixo custo e moderna para um nicho\nreal e desatendido do mercado educacional.", {
    x: 1.0, y: 2.75, w: 11.33, h: 1.9, fontFace: FONT_H, fontSize: 27, bold: true, color: C.white, align: "center", lineSpacingMultiple: 1.05,
  });
  s.addText("Gestão do processo seletivo + preparação do candidato, em uma única plataforma web e mobile.", {
    x: 1.5, y: 4.75, w: 10.33, h: 0.6, fontFace: FONT_B, fontSize: 15, color: "CFE6DB", align: "center", italic: true,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.92, y: 5.65, w: 3.5, h: 0.75, fill: { color: C.mint }, line: { type: "none" }, rectRadius: 0.1 });
  s.addText("Obrigado!  Perguntas?", { x: 4.92, y: 5.65, w: 3.5, h: 0.75, fontFace: FONT_H, fontSize: 17, bold: true, color: C.darkBg, align: "center", valign: "middle" });
  s.addText("[Nome 1]  ·  [Nome 2]  ·  [Nome 3]  ·  [Nome 4]", { x: 0, y: 6.65, w: W, h: 0.4, fontFace: FONT_B, fontSize: 12, color: "8FA39A", align: "center" });

  await pres.writeFile({ fileName: "OMAVEST-TCC.pptx" });
  console.log("OK: OMAVEST-TCC.pptx gerado.");
}

build().catch((e) => { console.error(e); process.exit(1); });
