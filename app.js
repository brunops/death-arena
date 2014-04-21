var sio = require('socket.io');
var http = require('http');
var send = require('send');

var game = require('./public/js/Game');
game.init(640, 520);

var port = process.env.PORT || 3000;

var server = http.createServer(function (req, res) {
  send(req, req.url).root(__dirname + '/public/build').pipe(res);
}).listen(port);

var io = sio.listen(server);
var playerIds = {};

var clientInputsQueue = [];

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

  socket.on('input', function (data) {
    data.playerId = playerIds[socket.id];
    clientInputsQueue = clientInputsQueue.concat(data);
  });
});

var pendingWorldStates = [];
var currentWorldState = 0;

setInterval(function () {
  var input, worldState;

  if (clientInputsQueue.length) {
    for (var i = 0; i < clientInputsQueue.length; ++i) {
      input = clientInputsQueue[i];
      game.applyInput(input.playerId, input);
      game.update();
    }
    clientInputsQueue = [];

    worldState = game.getWorldState();
    worldState.number = currentWorldState++;
    worldState.lastInput = input.inputNumber;
    worldState.t = Date.now();

    pendingWorldStates.push(worldState);
  }
}, 15);

setInterval(function () {
  if (pendingWorldStates.length) {
    io.sockets.volatile.emit('world-update', pendingWorldStates);
    pendingWorldStates = [];
  }
}, 1000 / 20);

console.log("Server listening on port " + port);
