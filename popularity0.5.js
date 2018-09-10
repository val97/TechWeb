var MongoClient = require('mongodb').MongoClient;
var url_DB = "mongodb://localhost:27017/mydb";		//db statico (con nomi di collezioni prefissati)	
var url = "mongodb://localhost:27017/";
var debug=false;
var gruppi=["sfs","1829","1828"];
//var gruppi=["1829","1828","1838","1839"];
var collection=["ass","rel","vid","vid_rel"];	//ass contiene gli elementi relativi alla popolarita' assoluta
					//rel contiene gli elementi relativi alla popolarita' relativa
					//vid continene tutti i possibili id di video
var MAXVID=20;
var is_updating=[false,false];
var reasons=["Random","Search","Related","Recent","Fvitali","LocalPopularity","GlobalPopularity","ArtistSimilarity","GenreSimilarity","BandSimilarity","unknown"];
var counter=0;			/////////////////////////////////////////////////////
//reset();
//insertLocAss("CC5ca6Hsb2Q","Related");
//insertLocRel("globID","CC5ca6Hsb2Q","Recent");
//insertGlobAss("CC5ca6Hsb2Q",5,0,new Date(),"Fvitali");		//id,num visualizzazioni,gruppo i-esimo
//insertGlobRel("globID","CC5ca6Hsb2Q",6,1,new Date(),"Fvitali");	//analogo
//findLocAss();
//findLocRel("globID");
//findGlobAss();
//findAll("ass");
//updateAll();
//find(20,null,true,"tot");

exports.gruppi=gruppi;
exports.reasons=reasons;
exports.reset=reset;
exports.insert=insert;
exports.insertLocAss=insertLocAss;
exports.insertLocRel=insertLocRel;
exports.updateAll=updateAll;
exports.findAll=findAll;
exports.findLocAss=findLocAss;
exports.findGlobAss=findGlobAss;
exports.findLocRel=findLocRel;
exports.findGlobRel=findGlobRel;
exports.isUpdating=isUpdating;


function reset(){		//resetta tutto (non so se sia effettivamente necessario usarlo)

	MongoClient.connect(url_DB, function(err, db) {
		if (err) throw err;
		if(debug) console.log("Database ass created!");
		db.close();
	});
	resetRec(0);
};
function resetRec(i){
	if(i<collection.length){		//+gruppi.length
		var targhet;
		if(i<collection.length)
			targhet=collection[i];
		/*else
			targhet=gruppi[i-collection.length];
		*/
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db("mydb");
			//console.log("dentro for: i = "+i+" "+targhet);
			dbo.createCollection(targhet, function(err, res) {
				if (err) throw err;
				if(debug) console.log("Collection assolute created!");
				dbo.collection(targhet).deleteMany({}, function(err, obj) {
    					if (err) throw err;
    					//console.log(obj.result.n + " document(s) deleted");
					resetRec(i+1);
    					db.close();
  				});
			});
		
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
function insert(from_id,to_id,n,i,date,reason){	
//from_id/to_id: da quale video(from_id) viene visualizzato quale video(to_id) 	
//se e' ass, from_id==null	
//n:che valore ci metto
//i:quale gruppo sta salvando le visualizzazioni	-1 se e' locale
	if(debug) console.log("inseert: from_id: "+from_id+" to_id: "+to_id+" num: "+n+" gruppo: "+gruppi[i]);
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
  			var dbo = db.db("mydb");
			var query={from_id:from_id,to_id:to_id,from:"me",reason:reason};
			var collection;
			if(from_id==null){
				collection="ass";
			}else{
				collection="rel";
			}
			insertId(from_id,to_id);
			if(i==-1){		//se e' locale
				var d=new Date();
					//incrementa il contatore di video visti con reason: reason
				dbo.collection(collection).update(query, {$inc:{num:n},$set:{last_watched:d}},{ upsert: true }, function(err, res) {
					if (err) throw err;
						//incrementa il contatore di video visti con qualsiasi reason
					query.reason="tot";
					dbo.collection(collection).update(query, {$inc:{num:n},$set:{last_watched:d}},{ upsert: true }, function(err, res) {
						if (err) throw err;
							
						resolve();
						db.close();
					});
				});
				
			}else{
				query.from=gruppi[i];
				dbo.collection(collection).update(query,{$set:{num:n},$max:{last_watched:date}},{ upsert: true }, function(err, res) {
					if (err) throw err;
					resolve();
					db.close();
				});
			}
		/*setTimeout(function() {
			
		}, 1000);*/
		});
	});
	return prom;
}
//inserisce gli id nel database come id usati
function insertId(from_id,to_id){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
  		var dbo = db.db("mydb");
		var query={from_id:from_id,to_id:to_id};
		if(from_id==null){
			collection="vid";
		}else{
			collection="vid_rel";
		}
		dbo.collection(collection).update(query,{$set:query},{ upsert: true }, function(err, res) {
			if (err) throw err;
			db.close();
		});
	});
			
}
//chiamando questa funzione vengono calcolati il numero totale di visualizzazioni
//sia assolute, che relative, per ogni video.
//e' necessario chiamare ciclicamente questa funzione per tener aggiornato il database.
function updateAll(){
	is_updating[0]=true;
	is_updating[1]=true;
	var prom1=sumReasonAll("ass");	
	prom1.then(function(){
		if(debug) console.log("sumReasonAll(ass) finished!!!");
	});
	var prom2=sumReasonAll("rel");
	prom2.then(function(){
		if(debug) console.log("sumReasonAll(rel) finished!!!");
	});
	updateTot("ass");
	updateTot("rel");
}
function updateTot(collection){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
  		var dbo = db.db("mydb");
		var col;
		if(collection=="ass")
			col="vid";
		else
			col="vid_rel";
		dbo.collection(col).find().toArray(function(err,result){
			if (err) throw err;
			if(result.length>0){
				updateTotRec(result,0,collection);
				updateTotLocal(result,0,collection);
			}
			if(debug) console.log("updating tot");
    			db.close();
		});
	});
	
}
function updateTotLocal(data,i,collection){
	if(i<data.length){
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
  			var dbo = db.db("mydb");
			var query={from_id:data[i].from_id,to_id:data[i].to_id,from:"me"};
			
			dbo.collection(collection).find(query).toArray(function(err,result){
				if(result.length>0){
					/*console.log("query: ");
					console.log(query);
					console.log(" result: ");
					console.log(result);*/
					if (err) throw err;
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
						if (err) throw err;
						//console.log(tot)
						updateTotRec(data,i+1,collection);
						if(debug) console.log("1 document updated!!");
						db.close();
					});
				}else{
					db.close();
				}
				
			});
		});
	}else{
		if(collection=="ass")
			is_updating[0]=false;			
		else
			is_updating[1]=false;
	}
}
function updateTotRec(data,i,collection){
	if(i<data.length){
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
  			var dbo = db.db("mydb");
			var query={from_id:data[i].from_id,to_id:data[i].to_id};
			
			dbo.collection(collection).find(query).toArray(function(err,result){
				/*console.log("query: ");
				console.log(query);
				console.log(" result: ");
				console.log(result);*/
				if (err) throw err;
				var tot=0;
				var lastWatched=new Date(result[0].last_watched);
				//console.log("collection: "+collection+" result: "+result[0]);
				var prevalent_index=0;
				var prevalent_num=0;
				for(var j=0;j<result.length;j++){
					var d=new Date(result[j].last_watched);
					if((result[j].from!="tot")&&(result[j].reason!="tot")){
						tot=tot+result[j].num;
						if(d>=lastWatched){
							lastWatched=d;
						}
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
					if (err) throw err;
					//console.log(tot)
					updateTotRec(data,i+1,collection);
					if(debug) console.log("1 document updated!!");
					db.close();
				});
				
			});
		});
	}else{
		if(collection=="ass")
			is_updating[0]=false;
		else									
			is_updating[1]=false;
	}
}

//somma tutte le reason
function sumReasonAll(collection){
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
		  	var dbo = db.db("mydb");
			var col;
			if(collection=="ass")
				col="vid";
			else
				col="vid_rel";
			dbo.collection(col).find().toArray(function(err,result){
				if (err) throw err;
				sumReason(result,col,0);
				resolve();
		    		db.close();
			});
		});
	});
	return prom;
}
function sumReason(data,collection,i){
	if(i<data.length){
		var prom;
		if(collection=="vid")
			prom=sumReasonId(data[i].id,null,0);
		else
			prom=sumReasonId(data[i].from_id,data[i].to_id,0);
		if(debug) console.log("counter"+counter);
		counter++;
		prom.then(function(){
			sumReason(data,collection,i+1);
		});
	}
}
//dato un id, fa le somme delle varie reason.
function sumReasonId(from_id,to_id,j){
	var prom=new Promise(function(resolve,reject){
		if(j<reasons.length){
			MongoClient.connect(url, function(err, db) {
				if (err) throw err;
		  		var dbo = db.db("mydb");
				var collection;
				var query={from_id:from_id,to_id:to_id,reason:reasons[j]}
				if(to_id==null){
					collection="ass";
				}else{
					collection="rel";
				}
				dbo.collection(collection).find(query).toArray(function(err,result){
					if (err) throw err;

					/*console.log("j: "+j+" reason: ");
					console.log(reasons[j]);
					console.log("result:");
					console.log(result);*/

					if(result.length>0)
						sumReasonRec(result,0,0,0,collection);
				
					sumReasonId(from_id,to_id,j+1);		//non e' completamente sincronizzato ma vabbe
					resolve();
		    			db.close();
				});
				
			});
		}else{
			resolve();
		}
	});
	return prom;
}
//data contiene solo elementi con lo stesso id/from_id e to_id, stessa reason
//i all'inizio e' 0
function sumReasonRec(data,i,sum,last_watched,collection){	
	if(i<data.length){
		var d=new Date(data[i].last_watched);
		if(last_watched>d)
			d=last_watched;
		if (data[i].from!="tot")
			sumReasonRec(data,i+1,sum+data[i].num,d,collection);
		else
			sumReasonRec(data,i+1,sum,last_watched,collection);
	}else{
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
  			var dbo = db.db("mydb");
			var query={from_id:data[0].from_id,to_id:data[0].to_id,from:"tot",reason:data[0].reason};
			
			dbo.collection(collection).update(query,{$set:{num:sum,last_watched:last_watched}},{ upsert: true }, function(err, res) {
				if (err) throw err;
				if(debug) console.log("1 document updated!!");
				db.close();
			});
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
		var prom2=find(MAXVID,null,true,"tot");
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;
}
function findLocRel(vid_id){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,vid_id,true,"tot");
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;
	
}
function findGlobAss(){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,null,false,"tot");
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;
	
}
function findGlobRel(vid_id){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,vid_id,false,"tot");
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;

}
function find(n,from_id,is_local,reason){				//trova gli n video piu visualizzati, tra quelli con reason 'reason'
//se from_id != null, restituisce i video relativi a from_id
//se is_local == true, restituisce video locali
//
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
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
			query.reason=reason;
			if(debug) console.log(query);
			if(n>0){
				dbo.collection(collection).find(query).sort({num:-1}).limit(n).toArray(function(err,result){
					if (err) throw err;
					if(debug) console.log("find:");
		    			if(debug) console.log(result);
					resolve(result);
					if(debug) console.log("find finished!");
		    			db.close();
				});
			}else{}
			
		});
	});
	return prom;
}
function findAll(collection){				//trova gli n video piu visualizzati
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
	  		var dbo = db.db("mydb");
			dbo.collection(collection).find().toArray(function(err,result){
				if (err) throw err;
				if(debug) console.log("find:");
	    			if(debug) console.log(result);
				resolve(result);
	    			db.close();
			});
		});
	});
	return prom;
	
}
