var MongoClient = require('mongodb').MongoClient;
var locpop = require ('./popularity.js');
var https = require('http');
var url = "mongodb://localhost:27017/";
var gruppi=locpop.gruppi;
var debug=false;		

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
//console.log(locpop.gruppi);

function keepUpdatingAss(){
	if(debug) console.log("in keepUpdatingAss()");
	updateAss(0);
	var prom= updateAss(0);
	prom.then(function(){
		locpop.updateAll();
		//dovrei metterci anche updateRel() qui
		keepUpdatingAss();
	});
}
function updateAss(i){
	var prom=new Promise(function(resolve,reject){
		if(debug) console.log("in updateAss()");
		if(i<gruppi.length){
			var uri="http://site"+gruppi[i]+".tw.cs.unibo.it/globpop";
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
					var prom=updateGruppiAss(0,i,obj.recommended);
					prom.then(function(){
						prom2=updateAss(i+1);
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
			
			resolve();
		}
	});
	return prom;
	
}
function updateGruppiAss(i,j,data){
	var prom=new Promise(function(resolve,reject){
		if(debug) console.log("in updateGruppiAss() i:"+i+" j:"+j);
		if(i<data.length){
		
			var id="";			
			if(data[i].videoId!=null)
				id=data[i].videoId;
			else
				if(data[i].videoID!=null)
					id=data[i].videoID;
			var num=data[i].timesWatched;
			if(id!=""){
				//locpop.insert(id,null,num,j);	
				var prom1=locpop.insert(id,null,num,j);		
				prom1.then(function(){
					//updateGruppiAss(i+1,j,data);
					var prom2=updateGruppiAss(i+1,j,data);
					prom2.then(function(){
						resolve();
					});
				});
			}else{
				//updateGruppiAss(i+1,j,data);
				var prom2=updateGruppiAss(i+1,j,data);
				prom2.then(function(){
					resolve();
				});
			}
		}else
			resolve();
	});
	return prom;
	
}
