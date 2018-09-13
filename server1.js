var fs = require("fs");
var http = require("http");
var locpop = require ('./popularity0.6.js');
var url = require("url");			//permette di caricare anche gli script del file html
var mb = require('musicbrainz');
const request = require('request');




const express=require('express');
const app=express();

app.get('/',(req,res)=>{
		html = fs.readFileSync("alpha.html", "utf8");				//prima era progetto!!!
        res.send(html);
});


app.get('/script1.js',(req,res)=>{
	 script = fs.readFileSync("script1.js", "utf8");
        res.send(script);
});
app.get('/globpop',(req,res)=>{
	var id = req.query.id;
	var prom;
	if(id==null){
		prom=locpop.findApiAss();
	}else{
		prom=locpop.findApiRel(id);
	}
	prom.then(function(data){
		var array=[];
		var i;
		var video;
		var last_watched;
		
		var prom2=locpop.findOne(id,true);
		prom2.then(function(vid){
			if(vid!=null)
				last_watched=vid[0].last_watched.toUTCString();
			else
				last_watched=null;
			for(i=0;i<data.length;i++){
				
				var d=new Date(data[i].last_watched);
				video={
					videoId:data[i].to_id,
					timesWatched:data[i].num,
					prevalentReason:data[i].reason,
					lastSelected:d.toUTCString()
				};
				array.push(video);
			}
			var myobj={
				site:"http://site1830.tw.cs.unibo.it/",
				recommender:id,
				lastWatched:last_watched,
				recommended:array
			};
			res.end(JSON.stringify(myobj));
		});
	});
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
 if(body.results.bindings.length){
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
							  OPTIONAL {?song foaf:primaryTopic  ?wik.}
							  

							}UNION{
							  ?song dbo:artist ?artist.
							  OPTIONAL {?song dbo:genre ?genre.}
							  OPTIONAL {?song dbo:album ?album.}
							  OPTIONAL {?song dbo:releaseDate ?relDate.}
							  OPTIONAL {?song dbp:length ?len.}
							  OPTIONAL {?song foaf:primaryTopicOf  ?wik.}
							  
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
app.listen(8000, ()=>console.log("Listening on 8000"));

