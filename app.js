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

var playersInfo = {};
var clientInputsQueue = [];

io.sockets.on('connection', function (socket) {
  var player = game.addPlayer();

  playersInfo[player.id] = {
    socketId: socket.id,
    lastProcessedInput: 0
  };

  console.log(playersInfo)

  socket.emit('connection-established', {
    playerId: player.id,
    worldState: game.getWorldState()
  });

  socket.on('disconnect', function () {
    delete game.players[player.id];
  });

  socket.on('input', function (data) {
    for (var i = 0; i < data.length; ++i) {
      var input = data[i];

      // prevent players from pretending to be another player
      if (socket.id === playersInfo[input.playerId].socketId) {
        clientInputsQueue.push(input);
      }
    }
  });
});

var currentWorldState = 0;

setInterval(function () {
  var input;

  if (clientInputsQueue.length) {
    for (var i = 0; i < clientInputsQueue.length; ++i) {
      input = clientInputsQueue[i];
      game.applyInput(input.playerId, input);
      game.update();

      playersInfo[input.playerId].lastProcessedInput = input.inputNumber;
    }

    clientInputsQueue = [];
  }
}, 15);

setInterval(function () {
  var worldState = game.getWorldState();
  worldState.number = currentWorldState++;
  worldState.t = Date.now();

  for (playerId in playersInfo) {
    var socketId = playersInfo[playerId].socketId;

    worldState.lastInput = playersInfo[playerId].lastProcessedInput;
    io.sockets.connected[socketId].emit('world-update', worldState);
  }
}, 1000 / 10);

console.log("Server listening on port " + port);
