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
    y: [0, 460][Math.floor(Math.random() * 2)],
    direction: 'right'
  };

  socket.emit('start', {
    player: player,
    enemies: connectedPlayers
  });
  connectedPlayers[socket.id] = player;

  socket.broadcast.emit('player-connect', { id: socket.id, player: player });

  socket.on('disconnect', function () {
    delete connectedPlayers[socket.id];
    socket.broadcast.emit('player-disconnect', { id: socket.id });
  });

  socket.on('player-move', function (data) {
    var player = connectedPlayers[socket.id];
    player.x = data.x;
    player.y = data.y;
    player.direction = data.direction;
  });


  socket.on('shot', function (data) {
    socket.broadcast.emit('new-projectile', data);
  });
});

var syncEnemies = setInterval(function () {
  if (Object.keys(connectedPlayers).length > 1) {
    io.sockets.emit('enemies-sync', connectedPlayers);
  }
}, 10);




console.log("Server listening on port 3000");
