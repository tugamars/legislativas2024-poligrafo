
const PARTIDOS={
    "il":"Iniciativa Liberal",
    "l":"Livre",
    "ps":"Partido Socialista",
    "ad":"Aliança Democrática",
    "be":"Bloco de Esquerda",
    "ch":"Chega",
    "cdu":"Coligação Democrática Unitária",
    "pan":"Pessoas-Animais-Natureza",
};

const COLORS={
    "true":"bg-success",
    "true-but":"bg-info",
    "imprecise":"bg-warning",
    "decontextualized":"bg-primary",
    "false":"bg-danger",
    "manipulated":"bg-danger",
};

let articlesPage=0;
let articlesPaged=null;
let candidatos=null;

const chunk = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );
const percCalc = (value, total) => ((100 * value) / total).toFixed(0) + "%";

function loadCandidato(c){
    console.log(c);
    let imgC="assets/candidatos/"+c.candidato.toLowerCase()+".png";
    let imgP="assets/partidos/"+c.partido.toLowerCase()+".png";

    let total=0;
    for(k in c.sum){
        total+=c.sum[k];
    }

    let s='<tr>\n' +
        '\t\t\t\t  <th scope="row" class="text-left"> <img src="'+imgC+'" class="candidato-img"> '+c.nome +' </th>\n' +
        '\t\t\t\t  <td class="text-left"> <img src="'+imgP+'" class="partido-img"> '+PARTIDOS[c.partido.toLowerCase()] +' </th>\n' +
        '\t\t\t\t  <td class="stripped">'+(c.sum.true ?? 0)+'</td>\n' +
        '\t\t\t\t  <td class="stripped">'+percCalc((c.sum.true ?? 0),total)+'</td>\n' +
        '\t\t\t\t  <td>'+(c.sum["true-but"] ?? 0)+'</td>\n' +
        '\t\t\t\t  <td>'+percCalc((c.sum["true-but"] ?? 0),total)+'</td>\n' +
        '\t\t\t\t  <td class="stripped">'+(c.sum.imprecise ?? 0)+'</td>\n' +
        '\t\t\t\t  <td class="stripped">'+percCalc((c.sum.imprecise ?? 0),total)+'</td>\n' +
        '\t\t\t\t  <td>'+(c.sum["decontextualized"] ?? 0)+'</td>\n' +
        '\t\t\t\t  <td>'+percCalc((c.sum["decontextualized"] ?? 0),total)+'</td>\n' +
        '\t\t\t\t  <td class="stripped">'+(c.sum.false ?? 0)+'</td>\n' +
        '\t\t\t\t  <td class="stripped">'+percCalc((c.sum.false ?? 0),total)+'</td>\n' +
        '\t\t\t\t  <td>'+(c.sum["manipulated"] ?? 0)+'</td>\n' +
        '\t\t\t\t  <td>'+percCalc((c.sum["manipulated"] ?? 0),total)+'</td>\n' +
        '\t\t\t\t  <td class="stripped score text-warning">'+(0-c.points)+'</td>\n' +
        '\t\t\t\t  <td class="score text-info">'+total+'</td>\n' +
        '\t\t\t\t  <td class="stripped score text-warning">'+parseFloat((0-c.points)/total).toFixed(2)+'</td>\n' +
        '\t\t\t\t</tr>';

    $("#candidatos-body").append(s);
}

function loadArticle(a){
    if(a.candidato === "") return false;

    const c=candidatos[a.candidato];

    let imgC="assets/candidatos/"+c.candidato.toLowerCase()+".png";
    let imgP="assets/partidos/"+c.partido.toLowerCase()+".png";
    let imgA="assets/evaluation/"+a.evaluation.toString().toLowerCase()+".png";

    let s='<tr>\n' +
        '\t\t\t\t  <td scope="row" class="text-left"> <img src="'+imgC+'" class="candidato-img"> '+c.nome +' </td>\n' +
        '\t\t\t\t  <td class="text-left"> <img src="'+imgP+'" class="partido-img"></td>\n' +
        '\t\t\t\t  <td class="text-left">'+a.title+'</td>\n' +
        '\t\t\t\t  <td><img src="'+imgA+'" class="evaluation-img"></td>\n' +
        '\t\t\t\t  <td><a href="https://poligrafo.sapo.pt'+a.url+'" target="_blank">Ler artigo</a></td>\n' +
        '\t\t\t\t</tr>';

    $("#articles-body").append(s);
}

function loadArticlesGivenPage(page){
    const articles=articlesPaged[page];
    $("#articles-body").html("");
    for(const k in articles){
        loadArticle(articles[k]);
    }
}
function loadPage(num){
    const max=articlesPaged.length-1;
    if(num > max) return false;
    if(num < 0) return false;

    articlesPage=num;
    const next=num+1;
    const prev=num-1;

    if(prev >= 0) $("#prev-articles").removeClass("disabled"); else $("#prev-articles").addClass("disabled");
    if(next <= max) $("#next-articles").removeClass("disabled"); else $("#next-articles").addClass("disabled");

    loadArticlesGivenPage(articlesPage);
}

$("#prev-articles").click(function(){
    loadPage(articlesPage-1);
});
$("#next-articles").click(function(){
    loadPage(articlesPage+1);
});

$(document).ready(function(){
    fetch("data/fact-checks-processed.json")
        .then(response => response.json())
        .then(function(response) {
            $("#last-update").html("Última atualização:<br>" + new Date(response.lastUpdate).toLocaleString());

            candidatos=response.candidatos;

            let res = Object.values(response.candidatos).sort((a, b) => (b.points/b.totalArtigos)-(a.points/a.totalArtigos));
            for(k in res){
                loadCandidato(res[k]);
            }

            fetch("data/fact-checks-raw.json")
                .then(response => response.json())
                .then(function(response) {
                    articlesPaged=response.filter( (a) => a.candidato !== "");
                    articlesPaged=chunk(articlesPaged,6);
                    loadPage(0);
                })
                .catch(function(error) {
                    console.log(error);
                });

        })
        .catch(function(error) {
            console.log(error);
        });





});