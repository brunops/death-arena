var http = require('http');
var send = require('send');

var server = http.createServer(function (req, res) {
  send(req, req.url).root(__dirname + '/public/').pipe(res);
}).listen(process.env.PORT || 3000);




console.log("Server listening on port 3000");
