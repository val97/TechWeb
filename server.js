var fs = require("fs");
var http = require("http");
var locpop = require ('./popularity0.4.js');
var url = require("url");			//permette di caricare anche gli script del file html

http.createServer(function (request, response) {

    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");

    response.writeHead(200);

    if(pathname == "/") {
        html = fs.readFileSync("progetto.html", "utf8");
        response.write(html);
    } else if (pathname == "/script1.js") {
        script = fs.readFileSync("script1.js", "utf8");
        response.write(script);
    }
    if(pathname=="/popularity"){
	var q = url.parse(request.url, true).query;
	var from_id = q.from_id;
	var to_id = q.to_id;
	var reason=q.reason;
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
			response.end(JSON.stringify(data));
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
		response.end();
	}
    }else{
    	response.end();
    }
	//response.end();
}).listen(8000);
