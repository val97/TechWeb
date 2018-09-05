var MongoClient = require('mongodb').MongoClient;
var locpop = require ('./popularity0.5.js');
var https = require('http');
var url = "mongodb://localhost:27017/";
var gruppi=locpop.gruppi;
var debug=true;
var reasons=locpop.reasons;		

//locpop.reset();
//preUpdate();
//locpop.find_ass("globAss",200);
//save("globAss","serverAss");
//locpop.find_ass("serverAss",200);
//keep_update();

//updateGruppiAss(0,0,);
//locpop.find_ass("1828",200);
//saveAss(0);

keepUpdatingAss();

function keepUpdatingAss(){
	if(debug) console.log("in keepUpdatingAss()");
	var prom= updateGruppi(null,0);
	prom.then(function(){
		var prom1= updateRel();
		prom1.then(function(){
			locpop.updateAll();
			if(debug) console.log("nuovo ciclo!");
			//dovrei metterci anche updateRel() qui
			keepUpdatingAss();
		});
	});
}

function updateRel(){
	if(debug) console.log("in updateRel");
	var prom=new Promise(function(resolve,reject){
		var prom2= locpop.findAll("vid");
		prom2.then(function(data){
			var prom3= updateRelRec(data,0);
			prom3.then(function(){
				resolve();
			});
		});
	});
	return prom;
}
function updateRelRec(data,i){
	if(debug) console.log("in updateRelRec");
	var prom=new Promise(function(resolve,reject){
		if(i<data.length){
			var prom2= updateGruppi(data[i].to_id,0);
			prom2.then(function(){
				var prom3= updateRelRec(data,i+1);
				prom3.then(function(){
					resolve();
				});
			});
		}else{
			resolve();
		}
		
	});
	return prom;
}
//fa l'update dei video relativi a from_id (ass se from_id==null)
//i all'inizio deve essere 0
function updateGruppi(from_id,i){
	var prom=new Promise(function(resolve,reject){
		if(debug) console.log("in updateGruppi("+from_id+","+i+")");
		if(i<gruppi.length){
			var uri;
			if(from_id==null)
				uri="http://site"+gruppi[i]+".tw.cs.unibo.it/globpop";
			else
				uri="http://site"+gruppi[i]+".tw.cs.unibo.it/globpop?id=from_id";
			https.get(uri, (resp) => {
		  		var data = '';
					  	// A chunk of data has been recieved.
			 	resp.on('data', (chunk) => {
			   		data += chunk;
			 	});
		
				// The whole response has been received. Print out the result.
				resp.on('end', () => {
					var obj=JSON.parse(data);
					//updateGruppiAss(0,i,obj.recommended);
					var prom1=insertData(from_id,0,i,obj.recommended);
					prom1.then(function(){
						prom2=updateGruppi(from_id,i+1);
						prom2.then(function(){
							resolve();
						});
					});
					//console.log(obj.recommended);
					if(debug) console.log("ended");
				});
		
			}).on("error", (err) => {
				updateAss(i+1);
				console.log("Error: " + err.message);
			});
		}else{
			if(debug) console.log("updateGruppi finished!");
			resolve();
		}
	});
	return prom;
	
}
//inserisce data nel database
function insertData(from_id,i,j,data){
//i=elemento di data che sta venendo inserito
//j=gruppo che sta inserendo
//se e' relativo ad un video, gli elementi di data sono stati visualizzati dopo from_id, altrimenti
//	from_id sara' null.
	var prom=new Promise(function(resolve,reject){
		if(debug) console.log("in insertData() i:"+i+" j:"+j);
		if(i<data.length){
		
			var id="";			
			if(data[i].videoId!=null)
				id=data[i].videoId;
			else
				if(data[i].videoID!=null)
					id=data[i].videoID;
			var num=data[i].timesWatched;
			var lastWatched=0;
			if(data[i].lastSelected!=null)
				lastWatched=data[i].lastSelected;
			var reason=data[i].prevalentReason;
			reason=fixReasonName(reason);
			if(id!=""){
				var prom1=locpop.insert(from_id,id,num,j,lastWatched,reason);
				prom1.then(function(){
					var prom2=insertData(from_id,i+1,j,data);
					prom2.then(function(){
						resolve();
					});
				});
			}else{
				var prom2=insertData(from_id,i+1,j,data);
				prom2.then(function(){
					resolve();
				});
			}
		}else
			if(debug) console.log("insertData finished!");
			resolve();
	});
	return prom;
	
}
function fixReasonName(reason){
	var out="undefined";
	for(var i=0;i<reasons.length;i++){
		if(reason.toUpperCase()==reasons[i].toUpperCase()){
			out=reasons[i];
		}
	}
	return out;
}
