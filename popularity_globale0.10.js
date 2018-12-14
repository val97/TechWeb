var MongoClient = require('mongodb').MongoClient;
var locpop = require (__dirname+'/popularity0.10.js');
var https = require('http');
var portaDB=locpop.portaDB;
//var url = "mongodb+srv://tecweb:OOyytUjMGXsM8o6z@tecweb-x51d4.gcp.mongodb.net?retryWrites=true";
//var url="mongodb://localhost:27017";
//var url="mongodb://130.136.4.195:"+portaDB;
var url="mongodb://tecWeb:fluffyfluffy@130.136.4.195:"+portaDB;

var gruppi=locpop.gruppi;
var debug=false;
var reasons=locpop.reasons;		
var period_time=3600;//50000;			quanto passa da un ciclo di aggiornamento e un altro
var wait_insert=1;
var cicli_fatti=0;
//var last_turn=0;			//data di inizio dell'ultimo ciclo di keepUpdatingAss completamente terminato
//locpop.reset();
//preUpdate();
//locpop.find_ass("globAss",200);
//save("globAss","serverAss");
//locpop.find_ass("serverAss",200);
//keep_update();

//updateGruppiAss(0,0,);
//locpop.find_ass("1828",200);
//saveAss(0);
//locpop.debugDB(-1);
//keepUpdatingAss();
exports.keepUpdatingAss = keepUpdatingAss;
exports.debugCicle = debugCicle;
//locpop.debugDB(-1);
//debugCicle();
//console.log("pippo");
function debugCicle(){
	var prom1=locpop.debugDB(cicli_fatti);
	prom1.then(function(){
		cicli_fatti=cicli_fatti+1;
		console.log(cicli_fatti);
		debugCicle();
	});
}
//si autochiama continuamente, perr tenere aggiornato il DB, scaricando i dati degli altri utenti (updateGruppi e updateRel)
//ed elaborandoli (updateAll)
function keepUpdatingAss(){
	if(locpop.isUpdating()){
		setTimeout(function() {
			if(debug) console.log("!!! is updating !!!");
			keepUpdatingAss();
		}, 1000);
	}else{
		/*if(debug)*/ console.log("starting new cicle");
		//console.log(gruppi);
		var prom0= locpop.getLastTurn();
                prom0.then(function(last){
			//console.log(period_time);
			//last_turn=last;
			if(debug) console.log("!!! is NOT updating !!!");
			if(debug) console.log("in keepUpdatingAss()");
			locpop.updateAll(last);
			//console.log("prima di update Gruppi");
			var prom1= updateGruppi(null,0,true);			//prendo tutti i video in assoluto piu popolari per ogni gruppo e li salvo
			prom1.then(function(){
				var prom2= locpop.getLastTurn();
				prom2.then(function(last2){
					//console.log("in keep update ass: "+last2);
					var prom3= updateRel(0,last2);			//per ogni video cerco i video relativamente piu popolari
					prom3.then(function(){
						if(debug) console.log("nuovo ciclo!");
						//dovrei metterci anche updateRel() qui
						cicli_fatti=cicli_fatti+1;
						locpop.debugDB(cicli_fatti);		//a scopo di debug
						setTimeout(function(){
							var prom4= locpop.newTurn();
							prom4.then(function(){
								//console.log("last: "+last);
								keepUpdatingAss();
							});
						},period_time*1000);

					});
				});
			});
			//keepUpdatingAss();
		});
	}
}

//scarica tutti i video relativi a video gia' visti, da tutti gli altri gruppi
//i: il gruppo da cui sta scaricando, deve essere inizializzato a 0
//last: data prima della quale i dati sono gia stati aggiornati (presi dagli altri siti)
function updateRel(i,last){
	if(debug) console.log("in updateRel");
	//console.log("updateRel: "+last);
	var prom=new Promise(function(resolve,reject){
		//console.log(last);
		if(i<gruppi.length){
			var prom2= locpop.findVidGrup(i);		//prendo gli id dei video visualizzati dal gruppo i-esimo
			prom2.then(function(data){
				var prom3= updateRelRec(data,0,i,last);
				prom3.then(function(){
					var prom4= updateRel(i+1,last);
					prom4.then(function(){
						resolve();
					});
				});
			});
		}else
			resolve();
	});
	return prom;
}

//per ogni id contenuto in data, scarica i video visti dopo tale id
//i: video di data che sta venendo preso in considerazione, va inizializzato con 0
//gruppo: gruppo da cui stanno venendo prese le info
function updateRelRec(data,i,gruppo,last){
	if(debug) console.log("in updateRelRec");
	//console.log("updateRelRec: "+last);
	var prom=new Promise(function(resolve,reject){
		if(i<data.length){
			var d = data[i].last_watched;
			//console.log("updateRelRec: id: "+data[i].to_id+" last: "+last+" d: "+d);

			if((d==null)||(d>last)){
				//console.log("salvato!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
				var prom2= updateGruppi(data[i].to_id,gruppo,false);
				prom2.then(function(){
					var prom3= updateRelRec(data,i+1,gruppo,last);
					prom3.then(function(){
						resolve();
					});
				});
			}else{
				var prom3= updateRelRec(data,i+1,gruppo,last);
				prom3.then(function(){
					resolve();
				});
			}
		}else{
			resolve();
		}
		
	});
	return prom;
}

//fa l'update dei video relativi a from_id (ass se from_id==null)
//i: i-esimo gruppo dal quale scaricare i dati
//rec indica se debbano essere cercati video anche nei gruppi successivi (ricorsivamente) o meno
function updateGruppi(from_id,i,rec){
	var prom=new Promise(function(resolve,reject){
		if(debug) console.log("in updateGruppi("+from_id+","+i+")");
		if(i<gruppi.length){
			var uri;
			if(from_id==null)
				uri="http://site"+gruppi[i]+".tw.cs.unibo.it/globpop";
			else
				uri="http://site"+gruppi[i]+".tw.cs.unibo.it/globpop?id="+from_id;
			//console.log(uri);
			https.get(uri, (resp) => {
		  		var data = '';
					  	// A chunk of data has been recieved.
			 	resp.on('data', (chunk) => {
			   		data += chunk;
			 	});
		
				// The whole response has been received. Print out the result.
				resp.on('end', () => {
					try {
						var obj=JSON.parse(data);
						//updateGruppiAss(0,i,obj.recommended);
						if(obj.recommended!=undefined){
							var prom1=insertData(from_id,0,i,obj.recommended);
							prom1.then(function(){
								if(rec){
									prom2=updateGruppi(from_id,i+1,rec);
									prom2.then(function(){
										resolve();
									});
								}else{ 
									resolve();
								}
							});
						}else{
							if(rec){
								prom2=updateGruppi(from_id,i+1,rec);
								prom2.then(function(){
									resolve();
								});
							}else{ 
								resolve();
							}
						}
						
						//console.log(obj.recommended);
						if(debug) console.log("ended");
					}catch(err) {
						if(debug) console.log("errore collegamento ad api "+gruppi[i]+ ": "+err);
						if(rec){
							if(debug)console.log("api non trovata");
							var prom1=updateGruppi(from_id,i+1,rec);
							prom1.then(function(){
								resolve();
							});
							
						}else
							resolve();
						
					}
				});
		
			}).on("error", (err) => {
				var prom1=updateGruppi(from_id,i+1,rec);
				prom1.then(function(){
					resolve();
				});
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
//console.log("prima di timeout");
//		setTimeout(function(){
//console.log(wait_insert);
			if(debug) console.log("in insertData() i:"+i+" j:"+j);
			if(i<data.length){
			
				var id="";
				if(data[i].videoId!=null)
					id=data[i].videoId;
				else
					if(data[i].videoID!=null)
						id=data[i].videoID;
				var num=0;
				if(data[i].timesWatched!=null)
					num=data[i].timesWatched;
				var lastWatched=0;
				if(data[i].lastSelected!=null)
					lastWatched=data[i].lastSelected;
				var reason=data[i].prevalentReason;
				reason=locpop.fixReasonName(reason);
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
			}else{
				if(debug) console.log("insertData finished!");
				resolve();
			}
		});
//	},100000);

	return prom;
	
}
