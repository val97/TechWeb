var fs = require("fs");
var http = require("http");
var locpop = require ('./popularity0.5.js');
var url = require("url");			//permette di caricare anche gli script del file html
var mb = require('musicbrainz');
const request = require('request');




const express=require('express');
const app=express();
app.get('/',(req,res)=>{
		html = fs.readFileSync("alpha_prova.html", "utf8");				//prima era progetto!!!
        res.send(html);
});


app.get('/script1_prova.js',(req,res)=>{
	 script = fs.readFileSync("script1_prova.js", "utf8");
        res.send(script);
});

app.get('/popularity',(req,res)=>{
	var from_id = req.query.from_id;
	var to_id = req.query.to_id;
	var reason=req.query.reason;
	var ask=req.query.ask;
	//console.log("from_id: "+from_id+" to_id: "+to_id+" reason: "+reason+" ask: "+ask);
	if(ask!=null){
		var prom;
		if(ask=="popLocAss"){
			prom=locpop.findLocAss();
		}
		if(ask=="popLocRel"){
			prom=locpop.findLocRel(from_id);
		}
		if(ask=="popGlobAss"){
			prom=locpop.findGlobAss();
		}
		if(ask=="popGlobRel"){
			prom=locpop.findGlobRel(from_id);
		}
		prom.then(function(data){
			res.end(JSON.stringify(data));
		});
	}else{
		if(to_id != null){
			if(from_id == null){
				locpop.insertLocAss(to_id,reason);
			}else{
				locpop.insertLocRel(from_id,to_id,reason);
			}
		}
		res.end();
	}
    });

app.get('/abstract', (req,res)=>{
	//var q = url.parse(request.url, true).query;
		var artista= req.query.artist;
		var title=req.query.title;
		var Release = mb.Release;

    			//PER IL MOMENTO CERCA SOLTANTO PER ARTISTA, FRA POCO FACCIO IN MODO CHE CERCHI ANCHE PER BAND E MUSICALARTIST
    			//HO PRESO I RISULTATI solo IN INGLESE,
    			var url = "http://dbpedia.org/sparql";


				var query=`PREFIX dbo: <http://dbpedia.org/ontology/>
							PREFIX foaf:<http://xmlns.com/foaf/0.1/>
							SELECT distinct * WHERE {
							{
							    ?artist a dbo:MusicalArtist.
							    ?artist foaf:name ?artName.
							    ?artist dbo:abstract ?abstract .
							}UNION{
							    ?artist a dbo:Band.
							    ?artist foaf:name ?artName.
							    ?artist dbo:abstract ?abstract
							}.
							{
							    ?song dbo:musicalArtist ?artist.
							    ?song   dbo:abstract ?Sabstract .
							    ?song   foaf:name ?songName.
							}UNION{
							    ?song dbo:artist ?artist.
							    ?song   dbo:abstract ?Sabstract .
							    ?song   foaf:name ?songName.
							} .
							filter  regex(?artName, '`+artista+`', 'i')
							FILTER  ( langMatches(lang(?abstract), 'en'))
							FILTER  ( langMatches(lang(?Sabstract), 'en'))
							filter  regex(?songName, '`+title+`', 'i')
							}`;

				var queryUrl = encodeURI( url+"?query="+query );
							//console.log(queryUrl);



request.get(queryUrl, { json: true }, (err, res1, body) => {
  if (err) { return console.log(err); }
  //console.log(res1.statusCode);
 if(res1.statusCode){
  	console.log(res1.statusCode);
  	res.json(body);
  }
});



	});
	app.get('/info', (req,res)=>{
	//var q = url.parse(request.url, true).query;
		var artista= req.query.artist;
		var title=req.query.title;
		var info="";

    			//PER IL MOMENTO CERCA SOLTANTO PER ARTISTA, FRA POCO FACCIO IN MODO CHE CERCHI ANCHE PER BAND E MUSICALARTIST
    			//HO PRESO I RISULTATI solo IN INGLESE,
    			var url = "http://dbpedia.org/sparql";


				var query=` PREFIX dbo: <http://dbpedia.org/ontology/>
							PREFIX dbp: <http://dbpedia.org/property/>
							PREFIX foaf:<http://xmlns.com/foaf/0.1/>
							SELECT distinct ?artName ?songName ?relDate ?album ?len WHERE {
							?artist foaf:name ?artName.
							?song   foaf:name ?songName.
							{
							  ?song dbo:musicalArtist ?artist.
							  OPTIONAL {?song dbo:genre ?genre.}
							  OPTIONAL {?song dbo:album ?album.}
							  OPTIONAL {?song dbo:releaseDate ?relDate.}
							  OPTIONAL {?song dbp:length ?len.}
							}UNION{
							  ?song dbo:artist ?artist.
							  OPTIONAL {?song dbo:genre ?genre.}
							  OPTIONAL {?song dbo:album ?album.}
							  OPTIONAL {?song dbo:releaseDate ?relDate.}
							  OPTIONAL {?song dbp:length ?len.}
							}
							.
							filter  regex(?artName, '`+artista+`', 'i')
							filter  regex(?songName, '`+title+`', 'i')
							}`;



//artist non contiene informazioni quali genere,data pubbl ecc..
//id prendi da youtube

				var queryUrl = encodeURI( url+"?query="+query );
							//console.log(queryUrl);



request.get(queryUrl, { json: true }, (err, res1, body) => {
  if (err) { return console.log(err); }
  //console.log(res1.statusCode);
 if(res1.statusCode){
  	console.log("res1.statusCode");
  	res.json(body);
  }


});
});


app.get('/ArtistSimilarity',(req,res)=>{
	var title=req.query.titolo;
		var url = "http://dbpedia.org/sparql";
		var Artist= `PREFIX dbo: <http://dbpedia.org/ontology/>
								PREFIX foaf:<http://xmlns.com/foaf/0.1/>
									SELECT  distinct ?artName  WHERE{
										{
												?artist a <http://dbpedia.org/ontology/MusicalArtist>.
												?artist foaf:name ?artName.
												?song a <http://dbpedia.org/ontology/MusicalWork>.
												?song foaf:name ?songName.
												?song dbo:artist ?artist.
											}UNION
											{
												?artist a <http://dbpedia.org/ontology/MusicalArtist>.
												?artist foaf:name ?artName.
												?song a <http://dbpedia.org/ontology/MusicalWork>.
												?song foaf:name ?songName.
												?song dbo:musicalArtist ?artist.
											}
											filter (str(?songName)= '`+title+`')
										}`; 

			var queryArtist=`PREFIX dbo: <http://dbpedia.org/ontology/>
													SELECT distinct ?songName ?album ?date WHERE {
														?artist a <http://dbpedia.org/ontology/MusicalArtist>.
														?artist <http://xmlns.com/foaf/0.1/name> ?artName.
														?artist dbo:abstract ?abstract .
														?song <http://dbpedia.org/ontology/artist> ?artist.
														?song dbo:abstract ?Sabstract .
														?song dbo:album ?album.
														?song dbo:releaseDate ?date.
														?song <http://xmlns.com/foaf/0.1/name> ?songName.
														filter regex(?artName,'`+ Artist +`', 'i')
														filter ( langMatches(lang(?abstract), 'it'))
													}
													ORDER BY ?album DESC(?date) `;
			var queryUrlSimilarityA = encodeURI( url+"?query="+queryArtist);
			request.get(queryUrlSimilarityA, { json: true }, (err, res1,body) => {
			  if (err) { return console.log(err); }
			  console.log(res1.statusCode);
			 if(res1.statusCode){
			  	console.log("res1.statusCode");
			  	res.json(body);	
			  }


			});
});

app.get('/GenreSimilarity',(req,res)=>{
	var title=req.query.title;
	var url = "http://dbpedia.org/sparql";
	var genere=`PREFIX dbo: <http://dbpedia.org/ontology/>
									SELECT ?genereNome WHERE{
										?song a <http://dbpedia.org/ontology/MusicalWork>.
										?song <http://xmlns.com/foaf/0.1/name> ?songName.
										?song dbo:genre ?genere.
										?genere <http://xmlns.com/foaf/0.1/name> ?genereNome.
										FILTER regex(?songName, "`+ title +`")
									}`;
									//prendere il titolo della canzone corrente

			var Artist= `PREFIX dbo: <http://dbpedia.org/ontology/>
											PREFIX foaf:<http://xmlns.com/foaf/0.1/>
											SELECT  distinct ?artName  WHERE{
											{
												?artist a <http://dbpedia.org/ontology/MusicalArtist>.
												?artist foaf:name ?artName.
												?song a <http://dbpedia.org/ontology/MusicalWork>.
												?song foaf:name ?songName.
												?song dbo:artist ?artist.
											}UNION
											{
												?artist a <http://dbpedia.org/ontology/MusicalArtist>.
												?artist foaf:name ?artName.
												?song a <http://dbpedia.org/ontology/MusicalWork>.
												?song foaf:name ?songName.
												?song dbo:musicalArtist ?artist.
												}
												FILTER (str(?songName)= `+Stupid in Love+`)
												}`;
		var queryGenre=`PREFIX dbo: <http://dbpedia.org/ontology/>
												SELECT ?songName ?artistName ?genereNome WHERE{
													?song a <http://dbpedia.org/ontology/MusicalWork>.
													?song <http://xmlns.com/foaf/0.1/name> ?songName
													?song dbo:genre ?genere.
													?genere <http://xmlns.com/foaf/0.1/name> ?genereNome.
													?song dbo:artist ?artist.
													?artist <http://xmlns.com/foaf/0.1/name> ?artistName.
													FILTER regex(?genereNome, "`+ genere +`").
													FILTER ( ?artistName != "`+ Artist+`")
												}`;

	var queryUrlSimilarityG = encodeURI( url+"?query="+queryGenre);
	request.get(queryUrl, { json: true }, (err, res1, body) => {
			if (err) { return console.log(err); }
				//console.log(res1.statusCode);
		 if(res1.statusCode){
			console.log("res1.statusCode");
					res.json(body);
			}
	});
});

app.get('/BandSimilarity',(req,res)=>{
	var title=req.query.title;
	var url = "http://dbpedia.org/sparql";

var band=`PREFIX dbo: <http://dbpedia.org/ontology/>
							SELECT  ?bandName WHERE{
								?song a <http://dbpedia.org/ontology/MusicalWork>.
								?song <http://xmlns.com/foaf/0.1/name> ?songName.
								?song dbo:musicalBand ?band.
								?band  <http://xmlns.com/foaf/0.1/name>  ?bandName.
								FILTER regex(?songName, "`+title+`").
								}`;


var membriBand=` PREFIX dbo:<http://dbpedia.org/ontology/>
								PREFIX dbp:<http://dbpedia.org/property/>
								PREFIX foaf:<http://xmlns.com/foaf/0.1/>
								SELECT distinct ?memberName WHERE{
									{
										?artist a dbo:Band.
									}
									UNION{
										?artist a dbo:Band.
										?artist foaf:name ?artName.
										OPTIONAL{?artist dbo:bandMember ?member.}
										OPTIONAL{?artist dbo:formerBandMember ?member.}
										?member foaf:name ?memberName
									}
									FILTER regex(?artName,"`+ band +`")
								}`;

for(var i=0; i<membriBand.length; i++){
					var queryBand= `PREFIX dbo: <http://dbpedia.org/ontology/>
								PREFIX foaf:<http://xmlns.com/foaf/0.1/>
								SELECT  distinct ?songName ?bandName WHERE{
									{
											?artist a <http://dbpedia.org/ontology/MusicalArtist>.
											?artist foaf:name ?artName.
											?band foaf:name ?bandName.
											?band dbo:formerBandMember ?artist.
											?song a <http://dbpedia.org/ontology/MusicalWork>.
											?song foaf:name ?songName.
											?song dbo:musicalBand ?band.
										}
										UNION
										{
											?artist a <http://dbpedia.org/ontology/MusicalArtist>.
											?artist foaf:name ?artName.
											?band foaf:name ?bandName.
											?band dbo:bandMember ?artist.
											?song a <http://dbpedia.org/ontology/MusicalWork>.
											?song foaf:name ?songName.
											?song dbo:musicalBand ?band.
										}
										FILTER regex(?artName, "`+membriBand[i]+`").
										FILTER ( str(?bandName) != "`+band+`")
									}`;
		}

		var queryUrlSimilarityB = encodeURI( url+"?query="+queryBand);
		request.get(queryUrl, { json: true }, (err, res1, body) => {
				if (err) { return console.log(err); }
					//console.log(res1.statusCode);
			 if(res1.statusCode){
				console.log("res1.statusCode");
						res.json(body);
				}
		});

});
app.listen(8000, ()=>console.log("Listening on 8000"));
