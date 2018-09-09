var fs = require("fs");
var http = require("http");
var locpop = require ('./popularity');
var url = require("url");			//permette di caricare anche gli script del file html
var mb = require('musicbrainz');
const request = require('request');




const express=require('express');
const app=express();

app.get('/',(req,res)=>{
		html = fs.readFileSync("progetto.html", "utf8");
        res.send(html);
});


app.get('/script1.js',(req,res)=>{
	 script = fs.readFileSync("script1.js", "utf8");
        res.send(script);
});

app.get('/popularity',(req,res)=>{
	var from_id = req.query.from_id;
	var to_id = req.query.to_id;
	var reason=req.query.reason;
	if(reason!=null){
	
		var prom;
		if(reason=="popLocAss"){
			prom=locpop.findLocAss();
		}
		if(reason=="popLocRel"){
			prom=locpop.findLocRel(from_id);
		}
		if(reason=="popGlobAss"){
			prom=locpop.findGlobAss();
		}
		if(reason=="popGlobRel"){
			prom=locpop.findGlobRel(from_id);
		}
		prom.then(function(data){
			res.end(JSON.stringify(data));
		});
	}else{
		if(from_id != null){
			if(to_id == null){
				locpop.insertLocAss(from_id);
			}else{
				locpop.insertLocRel(from_id,to_id);
			}
		}
		res.end();
	}
    });

app.get('/info', (req,res)=>{
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
	//});
    app.listen(8000, ()=>console.log("Listening on 8000"));

