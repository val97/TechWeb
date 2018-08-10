

var http = require("http");
var url = require("url");			//permette di caricare anche gli script del file html

http.createServer(function (request, response) {

    response.writeHead(200);
    response.end();
}).listen(8000);

