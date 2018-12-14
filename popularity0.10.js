var MongoClient = require('mongodb').MongoClient;
var portaDB="1830";
//var url_DB = "mongodb+srv://tecweb:OOyytUjMGXsM8o6z@tecweb-x51d4.gcp.mongodb.net/mydb?retryWrites=true";   //localhost:27017/mydb";		//db statico (con nomi di collezioni prefissati)	
//var url_DB="mongodb://localhost:27017/mydb";
//var url_DB;
//var url = "mongodb+srv://tecweb:OOyytUjMGXsM8o6z@tecweb-x51d4.gcp.mongodb.net?retryWrites=true";   //localhost:27017/";
//var url="mongodb://localhost:27017";
//var url;
//require('dns').lookup(require('os').hostname(), function (err, add, fam) {
//	console.log(add);
//	url_DB="mongodb://"+add+":"+portaDB+"/mydb";
//	url="mongodb://"+add+":"+portaDB;
//	ip=add;
//	reset();
//});
var url_DB="mongodb://tecWeb:fluffyfluffy@130.136.4.195:"+portaDB+"/mydb";
var url="mongodb://tecWeb:fluffyfluffy@130.136.4.195:"+portaDB;
//const { spawn } = require('child_process');
var DB;

var debug=true;
//var gruppi=["sfs","1829","1838"];
var gruppi=["1829","1828","1838","1839","1846","1822",/*"1847",*/"1831","1827","1848","1824"];
//var gruppi=["1839","1824"];
var collection=["ass","rel","vid","vid_grup","vid_rel"];	//ass contiene gli elementi relativi alla popolarita' assoluta
					//rel contiene gli elementi relativi alla popolarita' relativa
					//vid continene tutti i possibili id di video
var MAXVID=20;
var is_updating=[false,false];
var reasons=["Random","Search","Related","Recent","Fvitali","LocalPopularity","GlobalPopularity","ArtistSimilarity","GenreSimilarity","BandSimilarity","unknown"];
var counter=0;			/////////////////////////////////////////////////////
//var last_turn=0;

var prom = getLastTurn();
prom.then(function(last){

//reset();
//insertLocAss("paperino","Fvitali");
//insertLocRel("globID","CC5ca6Hsb2Q","Recent");
//insertGlobAss("new baudo",5,0,new Date(),"Fvitali");		//id,num visualizzazioni,gruppo i-esimo
//insertGlobRel("pippo","pluto",6,1,new Date(),"Fvitali");	//analogo
//findLocAss();
//findLocRel("globID");
//findGlobAss();
//findGlobRel("cPTcpBJih_A");
//findApiAss();
//findApiRel("6GxWmSVv-cY");
//console.log(last_turn);
findAll("debug");
//updateAll(last);
//findOne("8of3uhG1tCI");
//find(20,null,true,"tot");
//newTurn();
//resetTurn();
/*var promLastTurn= getLastTurn();
promLastTurn.then(function(last){
	console.log(last);
});*/
});


exports.newTurn=newTurn;
exports.getLastTurn=getLastTurn;
exports.getSpawnSentence=getSpawnSentence;
exports.portaDB=portaDB;
exports.fixReasonName=fixReasonName;
exports.gruppi=gruppi;
exports.reasons=reasons;
exports.reset=reset;
exports.insert=insert;
exports.insertLocAss=insertLocAss;
exports.insertLocRel=insertLocRel;
exports.updateAll=updateAll;
exports.findAll=findAll;
exports.findOne=findOne;
exports.findLocAss=findLocAss;
exports.findGlobAss=findGlobAss;
exports.findLocRel=findLocRel;
exports.findGlobRel=findGlobRel;
exports.findApiAss=findApiAss;
exports.findApiRel=findApiRel;
exports.isUpdating=isUpdating;
exports.findVidGrup=findVidGrup;
exports.debugDB=debugDB;

//console.log("sto per chiamare il metodo launchDB");
//launchDB();
//console.log("ho lanciato");
//setTimeout(function(){
//	reset();
//	findLocAss();
	//insertLocAss("pluto","Fvitali");
//},10000);

//console.log(getSpawnSentence());
//reset();
function getSpawnSentence(){
	return([__dirname+'/mongodb/bin/mongod', ['--dbpath', __dirname+'/mongodb/data', '--bind_ip', '0.0.0.0', '--port', '1830'],ip,url]);
}
function launchDB(){
	DB = spawn(__dirname+'/mongodb/bin/mongod', ['--dbpath', __dirname+'/mongodb/data', '--bind_ip', '0.0.0.0', '--port', '1830']);
}

//resetta tutto
function reset(){		
console.log(url_DB);
	/*MongoClient.connect(url_DB, function(err, db) {
		if (err){console.log("errore!!!");}
		if(debug) console.log("Database ass created!");
		db.close();
	});*/
	resetTurn();
	resetRec(0);
};
function resetRec(i){
	//console.log(collection);
	if(i<collection.length){		//+gruppi.length
		var targhet;
		if(i<collection.length)
			targhet=collection[i];
		//else
		//	targhet=gruppi[i-collection.length];
		MongoClient.connect(url, function(err, db) {
			if(err) 
				resetRec(i);
			else{
				var dbo = db.db("mydb");
				//console.log("dentro for: i = "+i+" "+targhet);
				dbo.createCollection(targhet, function(err, res) {
					if(err){ resetRec(i); db.close();
					}else{
						if(debug) console.log("Collection assolute created!");
						dbo.collection(targhet).deleteMany({}, function(err, obj) {
							if(err){ resetRec(i); db.close();
							}else{
	    							//console.log(obj.result.n + " document(s) deleted");
								resetRec(i+1);
	    							db.close();
							}
  						});
					}
				});
			}
		});
	}
}

//inserisce vid_id come video visto localmente
function insertLocAss(vid_id,reason){
	insert(null,vid_id,1,-1,null,reason);
}
//inserisce from_id come video visto localmente, dopo aver visualizzato to_id
function insertLocRel(from_id,to_id,reason){
	insert(from_id,to_id,1,-1,null,reason);
}
//inserisce vid_id come video visto n volte, dal gruppo i-esimo
function insertGlobAss(vid_id,n,i,date,reason){
	insert(null,vid_id,n,i,date,reason);
}
//inserisce to_id come video visto n volte dopo aver visualizzato from_id, secondo il gruppo i-esimo
function insertGlobRel(from_id,to_id,n,i,date,reason){
	insert(from_id,to_id,n,i,date,reason);
}
//generalizza gli altri insert (viene infatti usato da essi)
function insert(from_id,to_id,n,i,date,reason_possibly_wrong){
//from_id/to_id: da quale video(from_id) viene visualizzato quale video(to_id)
//se e' ass, from_id==null
//n:che valore ci metto
//i:quale gruppo sta salvando le visualizzazioni        -1 se e' locale
        var reason=fixReasonName(reason_possibly_wrong)
        if(debug) console.log("inseert: from_id: "+from_id+" to_id: "+to_id+" num: "+n+" gruppo: "+gruppi[i]);
        var prom=new Promise(function(resolve,reject){
                MongoClient.connect(url, function(err, db) {
			if (err){
				var prom_e=insert(from_id,to_id,n,i,date,reason_possibly_wrong);
				prom_e.then(function(){
					resolve();
				});
			}else{
	                        var dbo = db.db("mydb");
	                        var query={from_id:from_id,to_id:to_id,from:"me",reason:reason};
	                        var collection;
	                        if(from_id==null){
	                                collection="ass";
	                        }else{
	                                collection="rel";
	                        }
	                        insertId(from_id,to_id,date,i);
	                        if(i==-1){              //se e' locale
	                                var d=new Date();
	                                        //incrementa il contatore di video visti con reason: reason
	                                dbo.collection(collection).update(query, {$inc:{num:n},$set:{last_watched:d.valueOf()}},{ upsert: true }, function(err, res) {
	                                                //incrementa il contatore di video visti con qualsiasi reason
	                                        query.reason="tot";
	                                        dbo.collection(collection).update(query, {$inc:{num:n},$set:{last_watched:d.valueOf()}},{ upsert: true }, function(err, res) {
	
	                                                resolve();
	                                                db.close();
	                                        });
	                                });
	
	                        }else{
	                                query.from=gruppi[i];
					var d=new Date(date);
	                                dbo.collection(collection).update(query,{$set:{num:n},$max:{last_watched:d.valueOf()}},{ upsert: true }, function(err, res) {
						if(err){
							prom_e2=insert(from_id,to_id,n,i,date,reason_possibly_wrong);
							prom_e2.then(function(){
								resolve();
								db.close();
							});
						}else{
		                                        resolve();
		                                        db.close();
						}
	                                });
	                        }
			}
                /*setTimeout(function() {

                }, 1000);*/
                });
        });
        return prom;
}
function debugDB(i){
//from_id/to_id: da quale video(from_id) viene visualizzato quale video(to_id) 	
//se e' ass, from_id==null	
//n:che valore ci metto
//i:quale gruppo sta salvando le visualizzazioni	-1 se e' locale
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if(err){
				var prom_e=debugDB(i);
				prom_e.then(function(){
					resolve();
				});
			}else{
	  			var dbo = db.db("mydb");
				dbo.collection("debug").find({name:"cicle count"}).toArray(function(err,result){
	                        	var d;
					var set={$set:{num:i}}
					if((result[0]==null)||(result[0].num>=i)){
						d=new Date();
						set={$set:{num:i,last_start:d}}
					}
					dbo.collection("debug").update({name:"cicle count"}, set,{ upsert: true }, function(err, res) {
								//incrementa il contatore di video visti con qualsiasi reason
						resolve();
						db.close();
					});
	                	});
			}
		});
		//resolve();
	});
	return prom;
}
//inserisce gli id nel database come id usati, relativi o non. vengono inseriti inoltre divisi per gruppo
//in una collezione apposta (o nel caso particolare, usati localmente)
function insertId(from_id,to_id,last_watched,gruppo){
	MongoClient.connect(url, function(err, db) {
  		if(err){
			insertId(from_id,to_id,last_watched,gruppo);
		}else{
			var dbo = db.db("mydb");
			var last_w=new Date(0);
			if(last_watched!=null)
				last_w=new Date(last_watched);
			var query={from_id:from_id,to_id:to_id,last_watched:last_w.valueOf()};
			//console.log(last_watched);
			if(from_id==null){
				collection="vid";
			}else{
				collection="vid_rel";
			}
			dbo.collection(collection).update(query,{$set:query},{ upsert: true }, function(err, res) {
				if(from_id==null){
					var query={to_id:to_id,last_watched:last_w.valueOf(),gruppo:gruppi[gruppo]};
					dbo.collection("vid_grup").update(query,{$set:query},{ upsert: true }, function(err, res) {
						db.close();
					});
				}else
					db.close();
			});
		}
	});
}
//chiamando questa funzione vengono calcolati il numero totale di visualizzazioni
//sia assolute, che relative, per ogni video.
//e' necessario chiamare ciclicamente questa funzione per tener aggiornato il database.
function updateAll(last){
	is_updating[0]=true;
	is_updating[1]=true;
	last_turn=last;
	var prom1=sumReasonAll("ass",last);	
	prom1.then(function(){
		if(debug) console.log("sumReasonAll(ass) finished!!!");
	});
	var prom2=sumReasonAll("rel",last);
	prom2.then(function(){
		if(debug) console.log("sumReasonAll(rel) finished!!!");
	});
	updateTot("ass",last);
	updateTot("rel",last);
}
//calcola per ogni video il numero di sue visualizzazioni, tenendo aggiornato il prevalent reason e
//	la data dell'ultima visualizzazione
//collection: indica se debbano essere calcolate le visualizzazioni dei video relativi ad altri o le visualizzazioni assolute
function updateTot(collection,last){
	MongoClient.connect(url, function(err, db) {
  		if(err){
			updateTot(collection,last);
		}else{
			var dbo = db.db("mydb");
			var col;
			if(collection=="ass")
				col="vid";
			else
				col="vid_rel";
			//console.log("in update tot");
			var query={last_watched:{$gt:last}};
			//console.log(query);
			//console.log(last);
			dbo.collection(col).find(query).toArray(function(err,result){	//considero solo gli elementi visti dopo last_watched
				//console.log(result);
				//console.log(last_turn);
				if(err){
					updateTot(collection,last);
					db.close();
				}else{
					if(result.length>0){
						updateTotRec(result,0,collection);
						updateTotLocal(result,0,collection);
					}else{
						if(collection=="ass")
							is_updating[0]=false;			
						else
							is_updating[1]=false;
					}
					if(debug) console.log("updating tot");
	    				db.close();
				}
			});
		}
	});
	
}
//ottiene la somma totale delle reason per i video visualizzati localmente
//data: lista di id da sommare
//i: i-esimo elemento di data da considerare
//collection: la collezione da cui prendere le info di partenza
function updateTotLocal(data,i,collection){
	if(i<data.length){
		MongoClient.connect(url, function(err, db) {
			if(err){
				updateTotLocal(data,i,collection);
			}else{
	  			var dbo = db.db("mydb");
				var query={from_id:data[i].from_id,to_id:data[i].to_id,from:"me"};
				//cerco tutte le visualizzazioni dalla relazione definita da data[i]
				dbo.collection(collection).find(query).toArray(function(err,result){
					if(err){
						updateTotLocal(data,i,collection);
						db.close();
					}else{
						if(result.length>0){
							/*console.log("query: ");
							console.log(query);
							console.log(" result: ");
							console.log(result);*/
							var tot=0;
							//console.log("collection: "+collection+" result: "+result[0]);
							var prevalent_index=0;
							var prevalent_num=0;
							for(var j=0;j<result.length;j++){
								if((result[j].num>prevalent_num)&&(result[j].reason!="tot")){
									prevalent_index=j;
									prevalent_num=result[j].num;
								}
							}
							query={from_id:data[i].from_id,to_id:data[i].to_id,from:"me",reason:"tot"};
							dbo.collection(collection).update(query,{$set:{prevalent_reason:result[prevalent_index].reason}},{ upsert: true }, function(err, res) {
								if(err) updateTotLocal(data,i,collection);
								else
									updateTotRec(data,i+1,collection);
								if(debug) console.log("1 document updated!!");
								db.close();
							});
						}else{
							db.close();
						}
					}
				});
			}
		});
	}else{
		if(collection=="ass")
			is_updating[0]=false;
		else
			is_updating[1]=false;
	}
}
//calcola per ogni video in data, la somma totale delle visualizzazioni, per ogni gruppo, per ogni reason
function updateTotRec(data,i,collection){
	if(i<data.length){
		MongoClient.connect(url, function(err, db) {
			if(err) updateTotRec(data,i,collection);
			else{
	  			var dbo = db.db("mydb");
				var query={from_id:data[i].from_id,to_id:data[i].to_id};

				dbo.collection(collection).find(query).toArray(function(err,result){
					//console.log("query: ");
					//console.log(query);
					//console.log(" result: ");
					//console.log(result);
					if(err){ updateTotRec(data,i,collection); db.close();
					}else{
						var tot=0;
						var lastWatched=new Date(result[0].last_watched);
						//console.log("collection: "+collection+" result: "+result[0]);
						var prevalent_index=0;		//indice del dato con reason con num. di visualizzazioni maggiore
						var prevalent_num=0;		//num massimo di visualizzazioni di una singola reason
						for(var j=0;j<result.length;j++){
							var d=new Date(result[j].last_watched);
							if((result[j].from!="tot")&&(result[j].reason!="tot")){	
								tot=tot+result[j].num;		//somma le visualizzazioni parziali, per ottenere quelle totali
								if(d>=lastWatched){
									lastWatched=d;
								}
							}
							//confronto il num. delle visualizzazioni per ogni reason e cerco la prevalent reason
							if((result[j].from!="tot")&&(result[j].reason=="tot")){		
								if(result[j].num>prevalent_num){
									prevalent_index=j;
									prevalent_num=result[j].num;
								}
							}
						}
						if(debug) console.log("prevalent_reason: "+result[prevalent_index].reason+" index: "+prevalent_index);
						if(debug) console.log(result[prevalent_index]);

						query={from_id:data[i].from_id,to_id:data[i].to_id,from:"tot",reason:"tot"};
						dbo.collection(collection).update(query,{$set:{num:tot,last_watched:lastWatched,prevalent_reason:result[prevalent_index].reason}},{ upsert: true }, function(err, res) {
							//console.log(tot)
							if(err) updateTotRec(data,i,collection);
							else{
								updateTotRec(data,i+1,collection);
								if(debug) console.log("1 document updated!!");
							}
							db.close();
						});
					}
				});
			}
		});
	}else{
		if(collection=="ass")
			is_updating[0]=false;
		else
			is_updating[1]=false;
	}
}

//somma le visualizzazioni per ogni gruppo, divise per reason di tutti i gruppi
//collection: indica da quale collezione prendere gli id dei video di cui bisogna fare le somme
function sumReasonAll(collection,last){
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if(err){
				var prom_e=sumReasonAll(collection,last);
				prom_e.then(function(){
					resolve();
				});
			}else{
		  		var dbo = db.db("mydb");
				var col;
				if(collection=="ass")
					col="vid";
				else
					col="vid_rel";
				dbo.collection(col).find({last_watched:{$gt:last}}).toArray(function(err,result){		//prendo solo gli id di video visti dopo last_watched
					if(err){
						var prom_e=sumReasonAll(collection,last);
						prom_e.then(function(){
							resolve();
						});
					}else{
						sumReason(result,col,0);
						resolve();
					}
		    			db.close();
				});
			}
		});
	});
	return prom;
}
//somma le visualizzazioni per ogni gruppo, divise per reason di tutti i gruppi
//data: array con gli id dei video da sistemare
//collection: indica se bisogna sommare le visualizzazioni dei video relativi ad altri video (collection="rel") o meno(collection="ass")
//i: i-esimo id di cui bisogna fare la somma, va inizializzato a 0
function sumReason(data,collection,i){
	if(i<data.length){
		var prom;
		if(collection=="vid")
			prom=sumReasonId(data[i].id,null,0);
		else
			prom=sumReasonId(data[i].from_id,data[i].to_id,0);
		if(debug){ console.log("counter"+counter); counter++;}
		prom.then(function(){
			sumReason(data,collection,i+1);
		});
	}
}
//dati from_id e to_id, e una reason, fa le somme delle visualizzazioni di tutti i gruppi, che sono state fatte per la reason j-esima.
function sumReasonId(from_id,to_id,j){
	var prom=new Promise(function(resolve,reject){
		if(j<reasons.length){
			MongoClient.connect(url, function(err, db) {
		  		if(err){
					var prom_e=sumReasonId(from_id,to_id);
					prom_e.then(function(){
						resolve();
					});
				}else{
					var dbo = db.db("mydb");
					var collection;
					var query={from_id:from_id,to_id:to_id,reason:reasons[j]}
					if(to_id==null){
						collection="ass";
					}else{
						collection="rel";
					}
					dbo.collection(collection).find(query).toArray(function(err,result){

						/*console.log("j: "+j+" reason: ");
						console.log(reasons[j]);
						console.log("result:");
						console.log(result);*/
						if(err){
							var prom_e2=sumReasonId(from_id,to_id,j);
							prom_e2.then(function(){
								resolve();
							});
						}else{
							if(result.length>0)
								sumReasonRec(result,0,0,0,collection);

							var prom2=sumReasonId(from_id,to_id,j+1);		//non e' completamente sincronizzato ma vabbe
							prom2.then(function(){
								resolve();
							});
						}
			    			db.close();
					});
				}
			});
		}else{
			resolve();
		}
	});
	return prom;
}
//data contiene solo elementi con lo stesso id/from_id e to_id, stessa reason
//i all'inizio e' 0
//last_watched e' in forma numerica
function sumReasonRec(data,i,sum,last_watched,collection){			
	if(i<data.length){
		var d=(new Date(data[i].last_watched)).valueOf();
		if(last_watched>d)
			d=last_watched;
		if (data[i].from!="tot")
			sumReasonRec(data,i+1,sum+data[i].num,d,collection);
		else
			sumReasonRec(data,i+1,sum,last_watched,collection);
	}else{
		MongoClient.connect(url, function(err, db) {
			if(err) sumReasonRec(data,i,sum,last_watched,collection);
			else{
  				var dbo = db.db("mydb");
				var query={from_id:data[0].from_id,to_id:data[0].to_id,from:"tot",reason:data[0].reason};
				
				dbo.collection(collection).update(query,{$set:{num:sum,last_watched:last_watched}},{ upsert: true }, function(err, res) {
					if(err) sumReasonRec(data,i,sum,last_watched,collection);
					if(debug) console.log("1 document updated!!");
					db.close();
				});
			}
		});
	}

}
//banale sistema di sincronizzazione: returna true se non sta venendo fatto un update. Puo' non funzionare se viene chiamato immediatamente dopo aver iniziato a fare l'update
function isUpdating(){
	if(is_updating[0]||is_updating[1])
		return true;
	else
		return false;
}



function findLocAss(){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,null,true,"tot",false);
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;
}
function findLocRel(vid_id){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,vid_id,true,"tot",false);
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;
	
}
function findGlobAss(){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,null,false,"tot",false);
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;
	
}
function findGlobRel(vid_id){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,vid_id,false,"tot",false);
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;

}
function findApiAss(){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,null,true,null,true);
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;

}
function findApiRel(vid_id){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,vid_id,true,null,true);
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;

}
function find(n,from_id,is_local,reason,is_api){				//trova gli n video piu visualizzati, tra quelli con reason 'reason'
//se from_id != null, restituisce i video relativi a from_id
//se is_local == true, restituisce video locali
//is_api restituisce solo quelle con reason parziali (!="tot")
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if(err){
				var prom_e=find(n,from_id,is_local,reason,is_api);
				prom_e.then(function(res){
					resolve(res);
				});
			}else{
	  			var dbo = db.db("mydb");
				var query={};
				var collection;
			
				if(from_id==null){
					collection="ass";
					
				}else{
					collection="rel";
					query.from_id=from_id;
					
				}
				if(is_local)
					query.from="me";
				else
					query.from="tot";
				if(is_api)
					query.reason={$ne: "tot" };
				else
					query.reason=reason;
				if(debug) console.log(query);
				if(n>0){
					dbo.collection(collection).find(query).sort({num:-1}).limit(n).toArray(function(err,result){
						if(debug) console.log("find:");
			    			if(debug) console.log(result);
						if(err){
							var prom_e2=find(n,from_id,is_local,reason,is_api);
							prom_e2.then(function(res){
								resolve(res);
							});
						}else{
							resolve(result);
						}
						if(debug) console.log("find finished!");
			    			db.close();
					});
				}else{}
			}
		});
	});
	return prom;
}
function findAll(collection){				//trova gli n video piu visualizzati
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
                       	if(err){
				var prom_e=findAll(collection);
				prom_e.then(function(res){
					resolve(res);
				});
			}else{
	  			var dbo = db.db("mydb");
				dbo.collection(collection).find().toArray(function(err,result){
					if(debug) console.log("find:");
	    				if(debug) console.log(result);
					if(err){
						var prom_e2=findAll(collection);
						prom_e2.then(function(res){
							resolve(res);
						});
					}else
						resolve(result);
	    				db.close();
				});
			}
		});
	});
	return prom;
	
}
//trova gli id dei video visualizzati dal gruppo con indice 'gruppo'
function findVidGrup(gruppo){
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if(err){
                                var prom_e=findVidGrup(gruppo);
                                prom_e.then(function(res){
                                        resolve(res);
                                });
			}else{
	  			var dbo = db.db("mydb");
				dbo.collection("vid_grup").find({gruppo:gruppi[gruppo]}).toArray(function(err,result){
					if(debug) console.log("find:");
	    				if(debug) console.log(result);
					if(err){
						var prom_e2=findVidGrup(gruppo);
						prom_e2.then(function(res){
							resolve(res);
						});
					}else
						resolve(result);
	    				db.close();
				});
			}
		});
	});
	return prom;
	
}
function findOne(vid_id,is_api){				//trova gli n video piu visualizzati
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
	  		var dbo = db.db("mydb");
			if(vid_id!=null){
				var query={to_id:vid_id};
				if(is_api){
					query.from="me",
					query.reason="tot"
				}
			
				dbo.collection("ass").find(query).toArray(function(err,result){
					if(debug) console.log("find:");
		    			if(debug) console.log(result);
					resolve(result);
		    			db.close();
				});
			}else{
				resolve(null);
		    		db.close();
			}
		});
	});
	return prom;
	
}

//indica che sta venendo cominciato un nuovo turno di keepUpdatingAss in popularity_globale
function newTurn(){
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if(err){
				var prom_e=newTurn();
				prom_e.then(function(){
					resolve();
				});
			}else{
				var dbo = db.db("mydb");
				dbo.collection("debug").find({type:"turn"}).toArray(function(err,result){
					if(debug) console.log("new turn:");
	    				if(debug) console.log(result);
					if(err){
						resolve();
						db.close();
					}else{
						var last_turn=0;
						var current_turn = (new Date()).valueOf()-3600000;		//tolgo il tempo corrispondente ad un giorno
						if(result.length>0)
							last_turn = result[0].current_turn;
						var to_set={$set:{last_turn:last_turn,current_turn:current_turn}};
						dbo.collection("debug").update({type:"turn"},to_set,{ upsert: true },function(err, res) {
							resolve();
	    						db.close();
						});
					}
				});
			}
		});
	});
	return prom;
}

//restiruisce piu' o meno la data di quando e' stato iniziato il turno precedente e che quindi sara' per certo gia' stato completato al giro corrente 
//(serve solo nella popolarita' globale)
function getLastTurn(){
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if(err){
				var prom_e=getLastTurn();
				prom_e.then(function(res){
					resolve(res);
				});
			}else{
				var dbo = db.db("mydb");
				//console.log("get last turn");
				dbo.collection("debug").find({type:"turn"}).toArray(function(err,result){
					if(err){
						var prom_e2=getLastTurn();
						prom_e2.then(function(res){
							resolve(res);
						});
					}else{
						if(result.length>0){
							//last_turn=result[0].last_turn;
							resolve(result[0].last_turn);
						}else resolve(0);
					}
    					db.close();
				});
			}
		});
	});
	return prom;
}

function resetTurn(){
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			var dbo = db.db("mydb");
			if(debug) console.log("turn reset!");
			var to_set={$set:{last_turn:0,current_turn:0}};
			dbo.collection("debug").update({type:"turn"},to_set,{ upsert: true } ,function(err, res) {
				resolve();
    				db.close();
			});
			
			
		});
	});
	return prom;
}
function fixReasonName(reason){
	var out="unknown";
	for(var i=0;i<reasons.length;i++){
		if(reason.toUpperCase()==reasons[i].toUpperCase()){
			out=reasons[i];
		}
	}
	return out;
}
