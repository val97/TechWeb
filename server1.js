var fs = require("fs");
var http = require("http");
var locpop = require ('./popularity');
var url = require("url");			//permette di caricare anche gli script del file html
var mb = require('musicbrainz');




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
	//var q = url.parse(request.url, true).query;
	var from_id = req.query.from_id;
	var to_id = req.query.to_id;
	var reason=req.query.reason;
	if(reason!=null){
	
		var prom;
		if(reason=="popLocAss"){
			prom=locpop.findLocAss();
		}
		if(reason=="popLocRel"){
			console.log("loc rel!!!");
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
				console.log("inserito: "+from_id);
			}else{
				locpop.insertLocRel(from_id,to_id);
				console.log("inserito: "+to_id+" dopo "+from_id);
			}
		}
		res.end();
	}
    });

app.get('/info', (req,res)=>{
	//var q = url.parse(request.url, true).query;
		var artist= req.query.artist;
		var title=req.query.title;
		var Release = mb.Release;
/*
		mb.searchRecordings('Seven Nation Army', { artist: 'The White Stripes' }, function(err, recordings){
    console.log(recordings);
    res.json(recordings);
});*/
		var release = new Release('e64016f9-0cad-4650-ab7b-4b8fe51cfc45');
			release.load(['artists'], function () {
			console.log(release);
		});
			res.json(release);
	});

    app.listen(8000, ()=>console.log("Listening on 8000"));

