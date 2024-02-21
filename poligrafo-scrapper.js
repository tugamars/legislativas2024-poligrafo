const axios = require('axios'); 
const cheerio = require('cheerio');
const fs=require('node:fs');

const listaCandidatos={
	"Pedro Nuno Santos":{
		"partido":"PS",
		"candidato":"PNS",
		"nome":"Pedro Nuno Santos",
	},
	"André Ventura":{
		"partido":"CH",
		"candidato":"AV",
		"nome":"André Ventura",
	},
	"Ventura":{
		"partido":"CH",
		"candidato":"AV",
		"nome":"André Ventura",
	},
	"Rui Rocha":{
		"partido":"IL",
		"candidato":"RR",
		"nome":"Rui Rocha",
	},
	"Inês Sousa Real":{
		"partido":"PAN",
		"candidato":"ISR",
		"nome":"Inês Sousa Real",
	},
	"Paulo Raimundo":{
		"partido":"CDU",
		"candidato":"PR",
		"nome":"Paulo Raimundo",
	},
	"Luís Montenegro":{
		"partido":"AD",
		"candidato":"LM",
		"nome":"Luís Montenegro",
	},
	"Mariana Mortágua":{
		"partido":"BE",
		"candidato":"MM",
		"nome":"Mariana Mortágua",
	},
	"Mortágua":{
		"partido":"BE",
		"candidato":"MM",
		"nome":"Mariana Mortágua",
	},
	"Rui Tavares":{
		"partido":"L",
		"candidato":"RT",
		"nome":"Rui Tavares",
	}
};

const truthClassifications={"true":0,"true-but":1,"imprecise":2,"decontextualized":3,"false":4,"manipulated":5,"pepper":6};

const extractAllLinks = ($,num) => [
	...new Set(
		$('.fact-check')
			.map((_, a) => {
				const $article=$(a);
				return {
					url: $article.find(".title > a").attr('href'),
					page: num
				}
			}) // Extract the href (url) from each link
			.toArray() // Convert cheerio object to array
	),
];
const extractLinks = ($,num) => [ 
	...new Set( 
		$('.fact-check') // Select pagination links 
			.filter( (_, a) => {
				const $article=$(a);
				const link=$article.find(".title > a").attr('href');
				if(allData.some(e => e.url === link)) return false;
				return $article.find(".title > a").text().includes("DEBATES 2024") || $article.find(".metadata > a").attr('href') === "/fact-checks/politica";
			})
			.map((_, a) => {
				const $article=$(a);
				return {
					url: $article.find(".title > a").attr('href'),
					title: $article.find(".title > a").text(),
					excerpt: $article.find(".excerpt").text(),
					classes: $article.attr("class"),
					category: $article.find(".metadata > a").attr('href'),
					page: num
				}
			}) // Extract the href (url) from each link 
			.toArray() // Convert cheerio object to array 
	), 
]; 

let allData=[];

let processedData={};

async function processAllData(){
	processedData.candidatos={};
	
	for(k in listaCandidatos){
		let c=listaCandidatos[k];
		c.sum={};
		c.totalArtigos=0;
		c.points=0;
		processedData.candidatos[c.candidato]=c;
	}
	
	processedData.finalizedList=[];
	
	for(k in allData){
		const info=allData[k];
		
		let type=null;
		let found=-1;
		for(j in truthClassifications){
			if(info.classes.includes("fact-check-evaluation-" + j)){ type=j; }
		}
		type=type.toString();

		let candidato=null;
		if(info.hasOwnProperty("candidato")){
			candidato=info.candidato;
		} else { candidato=null; }

		if(info.hasOwnProperty("confidenceLevel")){
			found=info.confidenceLevel;
		}

		if(candidato === null){
			//Avalia se candidato está no titulo com :
			for(j in listaCandidatos){
				if(info.title.includes(j+":")){ candidato=j; found=0; }
			}
		}

		if(candidato===null){
			//Avalia se candidato está no titulo sem :
			for(j in listaCandidatos){
				if(info.title.includes(j)){ candidato=j; found=1; }
			}
		}
		
		if(candidato===null){
			//Avalia se candidato está no excerto
			for(j in listaCandidatos){
				if(info.excerpt.includes(j)){ candidato=j; found=2; }
			}
		}

		if(candidato === "") candidato=null;

		if(candidato !== null){
			if(listaCandidatos.hasOwnProperty(candidato)) candidato=listaCandidatos[candidato].candidato;

			if(!processedData.candidatos[candidato].sum.hasOwnProperty(type+"")){
				processedData.candidatos[candidato].sum[type+""]=1; 
			}
			else processedData.candidatos[candidato].sum[type]+=1;

			processedData.candidatos[candidato].totalArtigos+=1;

			processedData.candidatos[candidato].points+=truthClassifications[type];
		}

		if(candidato === null || found !== 0){
			console.log("\n\n NENHUM CANDIDATO ENCONTRADO: " + found);
			console.log("\n" + info.title);
		}

		let infoComp=info;
		if(!infoComp.hasOwnProperty('candidato') || infoComp.candidato === null) infoComp.candidato=candidato;
		if(!infoComp.hasOwnProperty('evaluation') || infoComp.evaluation === null) infoComp.evaluation=type;
		if(!infoComp.hasOwnProperty('confidenceLevel') || infoComp.confidenceLevel === null) infoComp.confidenceLevel=found;
		
		processedData.finalizedList.push(infoComp);
		
	}
	
	await fs.writeFile('./fact-checks-raw.json', JSON.stringify(allData, null, 4), (err)=>{ console.log(err); });
	await fs.writeFile('./fact-checks-processed.json', JSON.stringify(processedData, null, 4), (err)=>{ console.log(err); });
}

function getPage(num){
	
	let found=false;
	
	axios.get('https://poligrafo.sapo.pt/fact-checks?pagina='+num).then(({ data }) => { 
		const $ = cheerio.load(data); // Initialize cheerio
		
		
		const links = extractLinks($,num);

		const allLinks=extractAllLinks($,num);
	 
		for (const k in allLinks){
			if(allLinks[k].url === "/fact-check/debates-2024-pedro-nuno-santos-recusa-ter-prometido-habitacao-digna-para-todos-ate-2024-tem-razao") found=true;
		}
		
		allData=allData.concat(links);
		
		console.log("Found: " + found + "\n");
		
		if(!found) getPage(num+1);
		else {
			processAllData();
			try {
			  
			  // file written successfully
			} catch (err) {
			  console.error(err);
			}
		}
	});	
	
}

if(fs.existsSync('./fact-checks-raw.json')){
	const data = JSON.parse(fs.readFileSync('./fact-checks-raw.json'));
	if(data !== null) allData=data;
}

getPage(1);
processedData.lastUpdate=new Date().getTime();
