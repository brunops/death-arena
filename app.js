var sio = require('socket.io');
var http = require('http');
var send = require('send');

var game = require('./public/js/Game');

var server = http.createServer(function (req, res) {
  send(req, req.url).root(__dirname + '/public/').pipe(res);
}).listen(process.env.PORT || 3000);

var io = sio.listen(server);
var playerIds = {};

io.sockets.on('connection', function (socket) {
  var newPlayer = game.addPlayer();

  playerIds[socket.id] = newPlayer.id;

  socket.emit('connection-established', {
    playerId: newPlayer.id,
    worldState: game.getWorldState()
  });

  socket.on('disconnect', function () {
    delete game.players[playerIds[socket.id]];
  });
});

console.log("Server listening on port 3000");
