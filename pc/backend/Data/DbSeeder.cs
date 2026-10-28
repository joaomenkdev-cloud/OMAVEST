using Microsoft.EntityFrameworkCore;
using Omavest.Models;

namespace Omavest.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (!await db.Disciplinas.AnyAsync())
        {
            var disciplinas = new[]
            {
                new Disciplina { Nome = "Matemática", Slug = "matematica", Icone = "calculator", Cor = "amarelo", Ordem = 1, Descricao = "Álgebra, geometria, funções, estatística e resolução de problemas." },
                new Disciplina { Nome = "Português", Slug = "portugues", Icone = "book-open", Cor = "verde", Ordem = 2, Descricao = "Interpretação, gramática, literatura e produção textual." },
                new Disciplina { Nome = "História", Slug = "historia", Icone = "landmark", Cor = "cinza", Ordem = 3, Descricao = "História do Brasil e geral com foco nos vestibulares." },
                new Disciplina { Nome = "Biologia", Slug = "biologia", Icone = "dna", Cor = "verde", Ordem = 4, Descricao = "Citologia, genética, ecologia, fisiologia e evolução." },
                new Disciplina { Nome = "Física", Slug = "fisica", Icone = "atom", Cor = "amarelo", Ordem = 5, Descricao = "Mecânica, eletricidade, ondas, termologia e óptica." },
                new Disciplina { Nome = "Química", Slug = "quimica", Icone = "flask-conical", Cor = "verde", Ordem = 6, Descricao = "Química geral, físico-química e orgânica." },
                new Disciplina { Nome = "Geografia", Slug = "geografia", Icone = "globe-2", Cor = "cinza", Ordem = 7, Descricao = "Espaço geográfico, geopolítica, clima e questões socioambientais." },
                new Disciplina { Nome = "Redação", Slug = "redacao", Icone = "pen-line", Cor = "amarelo", Ordem = 8, Descricao = "Estrutura dissertativo-argumentativa, repertório e competências do ENEM." }
            };
            db.Disciplinas.AddRange(disciplinas);
            await db.SaveChangesAsync();

            var map = disciplinas.ToDictionary(x => x.Slug, x => x.Id);
            var temas = new[]
            {
                new Tema { DisciplinaId = map["matematica"], Nome = "Funções e progressões", Slug = "funcoes-progressões", Ordem = 1 },
                new Tema { DisciplinaId = map["matematica"], Nome = "Geometria", Slug = "geometria", Ordem = 2 },
                new Tema { DisciplinaId = map["portugues"], Nome = "Interpretação de texto", Slug = "interpretacao-texto", Ordem = 1 },
                new Tema { DisciplinaId = map["portugues"], Nome = "Literatura", Slug = "literatura", Ordem = 2 },
                new Tema { DisciplinaId = map["historia"], Nome = "Brasil República", Slug = "brasil-republica", Ordem = 1 },
                new Tema { DisciplinaId = map["biologia"], Nome = "Genética", Slug = "genetica", Ordem = 1 },
                new Tema { DisciplinaId = map["biologia"], Nome = "Divisão celular", Slug = "divisao-celular", Ordem = 2 },
                new Tema { DisciplinaId = map["fisica"], Nome = "Mecânica", Slug = "mecanica", Ordem = 1 },
                new Tema { DisciplinaId = map["quimica"], Nome = "Estequiometria", Slug = "estequiometria", Ordem = 1 },
                new Tema { DisciplinaId = map["geografia"], Nome = "Geopolítica", Slug = "geopolitica", Ordem = 1 },
                new Tema { DisciplinaId = map["redacao"], Nome = "Redação ENEM", Slug = "redacao-enem", Ordem = 1 }
            };
            db.Temas.AddRange(temas);
            await db.SaveChangesAsync();

            var tema = temas.ToDictionary(x => x.Slug, x => x.Id);
            db.Conteudos.AddRange(
                C(tema["funcoes-progressões"], "Função do 1º grau", "material", "media", 30, "Uma função afim pode ser escrita como f(x)=ax+b. O coeficiente a indica a taxa de variação e b representa o valor inicial. Em problemas de vestibular, identifique as grandezas, determine a relação entre elas e interprete o gráfico como uma reta."),
                C(tema["funcoes-progressões"], "Função do 2º grau", "videoaula", "media", 35, "A função quadrática tem forma f(x)=ax²+bx+c, com a diferente de zero. As raízes podem ser obtidas pela fórmula de Bhaskara e o vértice ajuda a analisar máximos e mínimos. O sinal de a determina a concavidade da parábola."),
                C(tema["geometria"], "Áreas e semelhança", "lista", "media", 40, "Em geometria plana, relacione áreas, razões de semelhança e propriedades de triângulos. Figuras semelhantes preservam ângulos e possuem lados correspondentes proporcionais. A razão entre áreas é o quadrado da razão de semelhança."),
                C(tema["interpretacao-texto"], "Estratégias de interpretação", "material", "facil", 25, "Interpretação exige localizar informações explícitas, inferir relações implícitas, reconhecer o ponto de vista e observar elementos de coesão. Leia o comando antes de comparar as alternativas e evite escolher respostas apenas por palavras repetidas no texto."),
                C(tema["literatura"], "Modernismo brasileiro", "resumo", "media", 30, "O Modernismo brasileiro reuniu projetos estéticos diversos, valorizando experimentação formal, revisão crítica da identidade nacional e aproximação da linguagem cotidiana. Em vestibulares, relacione obra, contexto histórico e características de cada fase."),
                C(tema["brasil-republica"], "Primeira República", "material", "media", 35, "A Primeira República brasileira, de 1889 a 1930, foi marcada por federalismo, poder das oligarquias regionais, conflitos sociais e transformações urbanas. Questões costumam relacionar coronelismo, economia cafeeira e movimentos de contestação."),
                C(tema["genetica"], "Leis de Mendel", "videoaula", "media", 30, "A primeira lei de Mendel descreve a segregação dos alelos durante a formação dos gametas. Em cruzamentos simples, organize os genótipos parentais, determine os gametas possíveis e calcule as proporções esperadas nos descendentes."),
                C(tema["divisao-celular"], "Mitose e meiose", "material", "media", 30, "Mitose conserva o número de cromossomos e origina duas células geneticamente semelhantes, sendo importante para crescimento e reparo. Meiose reduz o número cromossômico pela metade e gera variabilidade genética, participando da formação de gametas."),
                C(tema["mecanica"], "Leis de Newton", "lista", "media", 40, "As leis de Newton relacionam movimento e forças. A primeira descreve a inércia, a segunda relaciona força resultante, massa e aceleração, e a terceira trata de pares de ação e reação em corpos distintos."),
                C(tema["estequiometria"], "Relações molares", "material", "media", 35, "Estequiometria usa a equação química balanceada para relacionar quantidades de reagentes e produtos. Converta dados para mol, aplique a proporção dos coeficientes e depois retorne à unidade solicitada."),
                C(tema["geopolitica"], "Globalização e blocos econômicos", "resumo", "media", 30, "A globalização amplia fluxos de capitais, mercadorias, informações e pessoas, mas ocorre de forma desigual. Blocos econômicos buscam reduzir barreiras e intensificar relações entre países em diferentes graus de integração."),
                C(tema["redacao-enem"], "Estrutura dissertativo-argumentativa", "material", "media", 45, "Uma redação dissertativo-argumentativa apresenta uma tese clara, desenvolve argumentos articulados e conclui retomando o projeto de texto. No ENEM, a proposta de intervenção deve respeitar os direitos humanos e detalhar ação, agente, meio e finalidade."),
                C(tema["redacao-enem"], "Coesão e repertório", "material", "media", 35, "Coesão conecta ideias por pronomes, conjunções, retomadas e progressão temática. O repertório deve ser pertinente ao tema e integrado ao argumento, evitando citações decorativas sem relação com a tese."));

            await db.SaveChangesAsync();
        }

        if (!await db.Questoes.AnyAsync())
        {
            db.Questoes.AddRange(
                Q("Matemática", "Funções", 2025, "facil", "Uma função afim é dada por f(x)=2x+3. Qual é o valor de f(4)?", "7", "8", "10", "11", "12", "D", "Substitua x por 4: 2·4+3=11."),
                Q("Matemática", "Porcentagem", 2025, "media", "Um produto de R$ 200 recebeu desconto de 15%. Qual é o preço final?", "R$ 170", "R$ 175", "R$ 180", "R$ 185", "R$ 190", "A", "15% de 200 é 30; 200-30=170."),
                Q("Biologia", "Divisão celular", 2025, "media", "Qual processo reduz pela metade o número de cromossomos na formação de gametas?", "Mitose", "Meiose", "Bipartição", "Brotamento", "Clonagem", "B", "A meiose é uma divisão reducional associada à formação de gametas."),
                Q("Biologia", "Genética", 2025, "facil", "Em um indivíduo heterozigoto Aa, quais alelos podem estar presentes nos gametas?", "Apenas A", "Apenas a", "A e a", "AA e aa", "Aa apenas", "C", "Os alelos se segregam e cada gameta recebe A ou a."),
                Q("Português", "Interpretação", 2025, "media", "Em uma questão de interpretação, uma inferência é:", "uma cópia literal do texto", "uma conclusão apoiada em pistas do texto", "uma opinião sem evidência", "um erro gramatical", "um título obrigatório", "B", "Inferir é concluir algo que não está dito literalmente, mas é sustentado pelo texto."),
                Q("História", "Brasil República", 2025, "media", "O coronelismo na Primeira República relaciona-se principalmente:", "à industrialização pesada estatal", "ao poder político local de grandes proprietários", "ao voto secreto universal", "à centralização monárquica", "à abolição das eleições", "B", "O coronelismo envolvia redes locais de poder e controle político-eleitoral."),
                Q("Física", "Mecânica", 2025, "media", "Um corpo de massa 2 kg sofre força resultante de 10 N. Qual é sua aceleração?", "2 m/s²", "4 m/s²", "5 m/s²", "8 m/s²", "20 m/s²", "C", "Pela segunda lei de Newton, a=F/m=10/2=5 m/s²."),
                Q("Química", "Estequiometria", 2025, "media", "Na equação 2H₂ + O₂ → 2H₂O, quantos mol de H₂O são formados a partir de 2 mol de H₂, com O₂ em excesso?", "1", "2", "3", "4", "0,5", "B", "A razão estequiométrica entre H₂ e H₂O é 2:2, portanto 2 mol geram 2 mol."),
                Q("Geografia", "Globalização", 2025, "media", "Um efeito típico da globalização contemporânea é:", "isolamento completo dos mercados", "redução dos fluxos informacionais", "intensificação de fluxos econômicos e informacionais", "fim das desigualdades regionais", "desaparecimento dos Estados", "C", "A globalização intensifica fluxos, embora não elimine desigualdades nem Estados."));
            await db.SaveChangesAsync();
        }

        if (!await db.Provas.AnyAsync())
        {
            db.Provas.AddRange(
                new Prova { Titulo = "Simulado modelo ENEM", Ano = 2026, Instituicao = "ENEM", Area = "geral", QuantidadeQuestoes = 9, DuracaoMinutos = 90, Fonte = "Questões demonstrativas OMAVEST" },
                new Prova { Titulo = "Simulado modelo FUVEST", Ano = 2026, Instituicao = "FUVEST", Area = "geral", QuantidadeQuestoes = 9, DuracaoMinutos = 90, Fonte = "Questões demonstrativas OMAVEST" });
            await db.SaveChangesAsync();
        }

        if (!await db.CalendarioVestibulares.AnyAsync())
        {
            var hoje = DateOnly.FromDateTime(DateTime.Today);
            db.CalendarioVestibulares.AddRange(
                new CalendarioVestibular { Instituicao = "FUVEST", Evento = "Simulado OMAVEST", DataInicio = hoje.AddDays(17), Tipo = "simulado" },
                new CalendarioVestibular { Instituicao = "UNESP", Evento = "Simulado OMAVEST", DataInicio = hoje.AddDays(25), Tipo = "simulado" },
                new CalendarioVestibular { Instituicao = "UNICAMP", Evento = "Simulado OMAVEST", DataInicio = hoje.AddDays(32), Tipo = "simulado" });
            await db.SaveChangesAsync();
        }

        if (!await db.Universidades.AnyAsync())
        {
            db.Universidades.AddRange(
                new Universidade { Nome = "Universidade de São Paulo", Sigla = "USP", Vestibular = "FUVEST", Localizacao = "São Paulo, SP", SiteOficial = "https://www.usp.br", Descricao = "Consulte cursos, formas de ingresso e informações oficiais no site da universidade." },
                new Universidade { Nome = "Universidade Estadual Paulista", Sigla = "UNESP", Vestibular = "VUNESP", Localizacao = "São Paulo, SP", SiteOficial = "https://www.unesp.br", Descricao = "Universidade pública estadual com campi em diversas cidades paulistas." },
                new Universidade { Nome = "Universidade Estadual de Campinas", Sigla = "UNICAMP", Vestibular = "COMVEST", Localizacao = "Campinas, SP", SiteOficial = "https://www.unicamp.br", Descricao = "Universidade pública estadual com processo seletivo próprio e diferentes modalidades de ingresso." });
            await db.SaveChangesAsync();
        }

        if (!await db.Usuarios.AnyAsync(x => x.FirebaseUid == "demo"))
        {
            var demo = new UsuarioPerfil
            {
                FirebaseUid = "demo", Nome = "Estudante", Email = "demo@omavest.local",
                VestibularAlvo = "ENEM", DataVestibular = DateOnly.FromDateTime(DateTime.Today.AddDays(128)),
                MinutosPorDia = 120
            };
            db.Usuarios.Add(demo);
            await db.SaveChangesAsync();

            var conteudos = await db.Conteudos.OrderBy(x => x.Id).Take(5).ToListAsync();
            var percentuais = new[] { 78, 62, 54, 81, 70 };
            for (var i = 0; i < conteudos.Count; i++)
                db.Progressos.Add(new ProgressoConteudo { FirebaseUid = "demo", ConteudoId = conteudos[i].Id, Percentual = percentuais[i], Concluido = percentuais[i] >= 100, AtualizadoEm = DateTime.UtcNow.AddDays(-i) });

            var disciplinas = await db.Disciplinas.OrderBy(x => x.Ordem).Take(5).ToListAsync();
            for (var i = 0; i < disciplinas.Count; i++)
            {
                var tema = await db.Temas.Where(t => t.DisciplinaId == disciplinas[i].Id).OrderBy(t => t.Ordem).FirstAsync();
                var conteudo = await db.Conteudos.Where(c => c.TemaId == tema.Id).OrderBy(c => c.Id).FirstAsync();
                db.Cronogramas.Add(new CronogramaEstudo
                {
                    FirebaseUid = "demo", Data = DateOnly.FromDateTime(DateTime.Today.AddDays(i)),
                    DisciplinaId = disciplinas[i].Id, TemaId = tema.Id, ConteudoId = conteudo.Id,
                    Titulo = conteudo.Titulo, MinutosPlanejados = 50, Percentual = percentuais[i]
                });
            }
            await db.SaveChangesAsync();
        }
    }

    private static Conteudo C(int temaId, string titulo, string tipo, string dificuldade, int duracao, string texto) =>
        new() { TemaId = temaId, Titulo = titulo, Tipo = tipo, Dificuldade = dificuldade, DuracaoMinutos = duracao, Descricao = texto.Length > 180 ? texto[..180] + "..." : texto, TextoBase = texto, Fonte = "Material autoral demonstrativo OMAVEST" };

    private static Questao Q(string materia, string tema, int ano, string dificuldade, string enunciado, string a, string b, string c, string d, string e, string resposta, string explicacao) =>
        new() { Materia = materia, Tema = tema, Ano = ano, Dificuldade = dificuldade, Enunciado = enunciado, AlternativaA = a, AlternativaB = b, AlternativaC = c, AlternativaD = d, AlternativaE = e, RespostaCorreta = resposta, Explicacao = explicacao, Fonte = "Questão demonstrativa OMAVEST" };
}
