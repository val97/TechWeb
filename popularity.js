var MongoClient = require('mongodb').MongoClient;
var url_DB = "mongodb://localhost:27017/mydb";		//db statico (con nomi di collezioni prefissati)	
var url = "mongodb://localhost:27017/";
var debug=false;
var gruppi=["1828","1838"];
var collection=["ass","rel"];
var MAXVID=20;
var is_updating=[false,false];

//reset();

//insertLocAss("LocID1");
//insertLocRel("locDaID","locDaID");
//insertGlobAss("globID1",5,0);		//id,num visualizzazioni,gruppo i-esimo
//insertGlobRel("globID","globID",6,1);	//analogo
//findLocAss();
//findGlobAss();
//findAll("ass");
//updateAll();
exports.gruppi=gruppi;
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


function reset(){		//resetta tutto (non so se sia effettivamente necessario usarlo)

	MongoClient.connect(url_DB, function(err, db) {
		if (err) throw err;
		if(debug) console.log("Database ass created!");
		db.close();
	});
	resetRec(0);
};
function resetRec(i){
	if(i<collection.length+gruppi.length){
		var targhet;
		if(i<collection.length)
			targhet=collection[i];
		else
			targhet=gruppi[i-collection.length];
		
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db("mydb");
			console.log("dentro for: i = "+i+" "+targhet);
			dbo.createCollection(targhet, function(err, res) {
				if (err) throw err;
				if(debug) console.log("Collection assolute created!");
				dbo.collection(targhet).deleteMany({}, function(err, obj) {
    					if (err) throw err;
    					console.log(obj.result.n + " document(s) deleted");
					resetRec(i+1);
    					db.close();
  				});
			});
		
		});
		
	}
}

//inserisce vid_id come video visto localmente
function insertLocAss(vid_id){
	insert(vid_id,null,1,-1);
}
//inserisce from_id come video visto localmente, dopo aver visualizzato to_id
function insertLocRel(from_id,to_id){
	insert(from_id,to_id,1,-1);
}
//inserisce vid_id come video visto n volte, dal gruppo i-esimo
function insertGlobAss(vid_id,n,i){
	insert(vid_id,null,n,i);
}
//inserisce to_id come video visto n volte dopo aver visualizzato from_id, secondo il gruppo i-esimo
function insertGlobRel(from_id,to_id,n,i){
	insert(from_id,to_id,n,i);
}
//generalizza gli altri insert (viene infatti usato da essi)
function insert(from_id,to_id,n,i){	
//from_id/to_id: da quale video(from_id) viene visualizzato quale video(to_id) 		
//n:che valore ci metto
//i:quale gruppo sta salvando le visualizzazioni	-1 se e' locale
	console.log("inseert: from_id: "+from_id+" to_id: "+to_id+" num: "+n+" gruppo: "+gruppi[i]);
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
  			var dbo = db.db("mydb");
			var query;
			var collection;
			if(to_id==null){
				query={id:from_id,from:"me"};
				collection="ass";
			}else{
				query={from_id:from_id,to_id:to_id,from:"me"};
				collection="rel";
			}
			if(i==-1){
				dbo.collection(collection).update(query, {$inc:{num:n}},{ upsert: true }, function(err, res) {
					if (err) throw err;
					resolve();
					db.close();
				});
			}else{
				query.from=gruppi[i];
				dbo.collection(collection).update(query,{$set:{num:n}},{ upsert: true }, function(err, res) {
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
/*function updateTotAss(){
	console.log("pippo");
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
  		var dbo = db.db("mydb");
		
		dbo.collection("ass").find().toArray(function(err,result){
			if (err) throw err;
			updateTotAssRec(result,0);
			console.log("updating tot");
    			db.close();
		});
	});
	
}*/
//chiamando questa funzione vengono calcolati il numero totale di visualizzazioni
//sia assolute, che relative, per ogni video.
//e' necessario chiamare ciclicamente questa funzione per tener aggiornato il database.
function updateAll(){
	is_updating[0]=true;
	is_updating[1]=true;
	updateTot(true);
	updateTot(false);
}
function updateTot(is_ass){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
  		var dbo = db.db("mydb");
		var collection;
		if(is_ass)
			collection="ass";
		else
			collection="rel";
		dbo.collection(collection).find().toArray(function(err,result){
			if (err) throw err;
			updateTotRec(result,0,is_ass);
			console.log("updating tot");
    			db.close();
		});
	});
	
}
function updateTotRec(data,i,is_ass){
	if(i<data.length){
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
  			var dbo = db.db("mydb");
			var collection;
			var query;
			if(is_ass){
				collection="ass";
				query={id:data[i].id};
			}else{
				collection="rel";
				query={from_id:data[i].from_id,to_id:data[i].to_id};
			}
			dbo.collection(collection).find(query).toArray(function(err,result){
				if (err) throw err;
				//console.log(result);
				var tot=0;
				console.log(result);
				for(var j=0;j<result.length;j++){
					if(result[j].from!="tot"){
						tot=tot+result[j].num;
					}
				}
				//console.log(tot);
				if(is_ass)
					query={id:data[i].id,from:"tot"};
				else
					query={from_id:data[i].from_id,to_id:data[i].to_id,from:"tot"};
				dbo.collection(collection).update(query,{$set:{num:tot}},{ upsert: true }, function(err, res) {
					if (err) throw err;
					//console.log(tot)
					updateTotRec(data,i+1,is_ass);
					if(debug) console.log("1 document updated!!");
					db.close();
				});
			});
		});
	}else{
		if(is_ass)
			is_updating[0]=false;
		else
			is_updating[1]=false;
	}
}
//banale sistema di sincronizzazione: returna true se non sta venendo fatto un update. Puo' non funzionare se viene chiamato immediatamente dopo aver iniziato a fare l'update
function isUpdating(){
	if(is_updating[0]||is_updating[1])
		return true;
	else
		return false;
}
/*function updateTotAssRec(data,i){
	if(i<data.length){
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
  			var dbo = db.db("mydb");
			dbo.collection("ass").find({id:data[i].id}).toArray(function(err,result){
				if (err) throw err;
				//console.log(result);
				var tot=0;
				console.log(result);
				for(var j=0;j<result.length;j++){
					if(result[j].from!="tot"){
						tot=tot+result[j].num;
					}
				}
				//console.log(tot);
				dbo.collection("ass").update({id:data[i].id,from:"tot"}, {$set:{num:tot}},{ upsert: true }, function(err, res) {
					if (err) throw err;
					//console.log(tot)
					updateTotAssRec(data,i+1);
					if(debug) console.log("1 document updated!!");
					db.close();
				});
			});
		});
	}
}*/


function findLocAss(){
	var prom=new Promise(function(resolve,reject){
		if(debug) console.log("in findLocAss");
		var prom2=find(MAXVID,null,true);
		prom2.then(function(data){
			if(debug) console.log("in then, data:");
			if(debug) console.log(data);
			resolve(data);
		});
	});
	return prom;
}
function findLocRel(vid_id){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,vid_id,true);
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;
	
}
function findGlobAss(){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,null,false);
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;
	
}
function findGlobRel(vid_id){
	var prom=new Promise(function(resolve,reject){
		var prom2=find(MAXVID,vid_id,false);
		prom2.then(function(data){
			resolve(data);
		});
	});
	return prom;

}
function find(n,from_id,is_local){				//trova gli n video piu visualizzati
	var prom=new Promise(function(resolve,reject){
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
	  		var dbo = db.db("mydb");
			var query;
			var collection;
		
			if(from_id==null){
				collection="ass";
				if(is_local)
					query={from:"me"};
				else
					query={from:"tot"}
		
			}else{
				collection="rel";
				console.log("is rel!!");
				if(is_local)
					query={from_id:from_id,from:"me"};
				else
					query={from_id:from_id,from:"tot"}
		
			}
			if(debug) console.log(query);
			dbo.collection(collection).find(query).sort({num:-1}).limit(n).toArray(function(err,result){
				if (err) throw err;
				if(debug) console.log("find:");
	    			if(debug) console.log(result);
				resolve(result);
				if(debug) console.log("find finished!");
	    			db.close();
			});
		});
	});
	return prom;
}
function findAll(collection){				//trova gli n video piu visualizzati
	console.log("pippo");
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
  		var dbo = db.db("mydb");
		dbo.collection(collection).find().toArray(function(err,result){
			if (err) throw err;
			if(debug) console.log("find:");
    			if(debug) console.log(result);
			
    			db.close();
		});
	});
	
}
