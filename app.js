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

var lastSentUpdateInput = 0,
    lastProcessedInput = 0,
    currentWorldState = 0;

setInterval(function () {
  var input;

  if (clientInputsQueue.length) {
    for (var i = 0; i < clientInputsQueue.length; ++i) {
      input = clientInputsQueue[i];
      game.applyInput(input.playerId, input);
      game.update();

      lastProcessedInput = input.inputNumber;
    }

    clientInputsQueue = [];
  }
}, 15);

setInterval(function () {
  var worldState;

  if (lastSentUpdateInput < lastProcessedInput) {
    worldState = game.getWorldState();
    worldState.number = currentWorldState++;
    worldState.lastInput = lastProcessedInput;
    worldState.t = Date.now();

    io.sockets.volatile.emit('world-update', worldState);

    lastSentUpdateInput = worldState.lastInput;
  }
}, 1000 / 20);

console.log("Server listening on port " + port);
