var sio = require('socket.io');
var http = require('http');
var send = require('send');

var server = http.createServer(function (req, res) {
  send(req, req.url).root(__dirname + '/public/').pipe(res);
}).listen(process.env.PORT || 3000);

var io = sio.listen(server);
var connectedPlayers = {};

io.sockets.on('connection', function(socket) {
  var player = {
    x: Math.floor(Math.random() * 100),
    y: [0, 460][Math.floor(Math.random() * 2)]
  };

  socket.emit('start', {
    player: player,
    enemies: connectedPlayers
  });
  connectedPlayers[socket.id] = player;

  socket.broadcast.emit('player-connect', { id: socket.id, player: player });

  socket.on('disconnect', function () {
    socket.broadcast.emit('player-disconnect', { id: socket.id });
  });
});

console.log("Server listening on port 3000");
