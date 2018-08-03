

var fs = require("fs");
var http = require("http");
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


    response.end();
}).listen(8000);

