// ============================================================
//  OMAVEST — Configuração única dos simulados
//  Lê /data/simulado-config.json (limite de questões, tempo e dados dos cards)
//  e /data/banco-simulado.json (questões). O app mobile usa os mesmos arquivos.
// ============================================================
(function () {
    const BASE = location.protocol.startsWith('http') ? '' : 'http://localhost:5000';
    const CLASSE_NIVEL = { 'Fácil': 'facil', 'Médio': 'medio', 'Difícil': 'dificil' };
    let promessa = null;

    function carregar() {
        if (!promessa) {
            const ler = arq => fetch(`${BASE}/data/${arq}`).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            });
            promessa = Promise.all([ler('simulado-config.json'), ler('banco-simulado.json')])
                .then(([config, banco]) => ({ config, banco }))
                .catch(e => { promessa = null; throw e; });   // permite tentar de novo
        }
        return promessa;
    }

    // Questões da matéria no nível escolhido ('misto' = todos os níveis)
    function disponiveis(dados, materia, nivel) {
        const todas = dados.banco[materia] || [];
        return nivel && nivel !== 'misto' ? todas.filter(q => q.dificuldade === nivel) : todas;
    }

    // Tamanho do simulado: o limite da configuração, sem repetir questões
    function quantidade(dados, materia, nivel) {
        const cfg = dados.config[materia];
        return cfg ? Math.min(cfg.questoes, disponiveis(dados, materia, nivel).length) : 0;
    }

    const rotulo = n => `${n} ${n === 1 ? 'questão' : 'questões'}`;

    // Cards "Simulados disponíveis" da página inicial (index.html)
    function preencherCardsInicio() {
        const cards = document.querySelectorAll('.simulado-card[data-materia]');
        if (!cards.length) return;
        carregar().then(dados => {
            cards.forEach(card => {
                const m = card.dataset.materia;
                const cfg = dados.config[m];
                if (!cfg) return;
                card.dataset.category = cfg.categoria;
                const campo = nome => card.querySelector(`[data-campo="${nome}"]`);
                campo('nivel').textContent = cfg.nivel;
                campo('nivel').className = `difficulty-badge ${CLASSE_NIVEL[cfg.nivel] || 'medio'}`;
                campo('tempo').textContent = cfg.tempo;
                const n = quantidade(dados, m, 'misto');
                campo('questoes').textContent = n;
                campo('questoes').nextSibling.textContent = n === 1 ? ' questão' : ' questões';
                campo('nota').textContent = cfg.nota;
                campo('feitos').textContent = cfg.feitos;
            });
        }).catch(() => { /* sem servidor: os cards ficam com "–" */ });
    }

    window.OMAVEST_SIMULADOS = { carregar, disponiveis, quantidade, rotulo };
    document.addEventListener('DOMContentLoaded', preencherCardsInicio);
})();
