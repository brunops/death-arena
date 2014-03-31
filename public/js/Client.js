/* global module, require, io */
var Player = require('./Player'),
    Projectile = require('./Projectile'),
    Game = require('./Game');

module.exports = (function () {
  'use strict';

  function Client(width, height) {
    this.init(width, height);
  }

  // Key codes lookup
  Client.keyCodes = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32
  };

  Client.prototype.init = function (width, height) {
    this.game = Game;
    this.game.init(width, height);
    this.defineCanvas(width, height);

    this.player = null;

    // current keyboard state
    this.keyboardState = {};

    // communication with server
    this.socket = io.connect(window.location.origin);

    // Inputs not yet acknolwdged by the server
    this.pendingInputs = [];
    this.inputNumber = 0;

    this.bindEvents();
  };

  Client.prototype.defineCanvas = function (width, height) {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.canvas.width = width;
    this.canvas.height = height;

    var self = this;
    this.floorImg = new Image();
    this.floorImg.src = 'images/floortile11.bmp';
    this.floorImg.isLoaded = false;
    this.floorImg.onload = function () {
      self.floorPattern = self.ctx.createPattern(self.floorImg, 'repeat');
      self.floorImg.isLoaded = true;
    };
  };

  Client.prototype.bindEvents = function () {
    document.addEventListener('keydown', this.handleKeyDown.bind(this), false);
    document.addEventListener('keyup', this.handleKeyUp.bind(this), false);
    window.addEventListener('blur', this.handleBlur.bind(this), false);

    this.socket.on('connection-established', this.connectionEstablished.bind(this));
  };

  Client.prototype.connectionEstablished = function (data) {
    this.processEntities(data.worldState, 'players', Player);
    this.processEntities(data.worldState, 'projectiles', Projectile);

    console.log(this.game)
    this.player = this.game.players[data.playerId];
  };

  Client.prototype.processEntities = function (worldState, collectionName, Constructor) {
    var i, id, newEntity;

    for (i = 0; i < worldState[collectionName].length; ++i) {
      id = parseInt(worldState[collectionName][i].id, 10);

      if (!this.game[collectionName][id]) {
        newEntity = new Constructor(worldState[collectionName][i]);
        newEntity.id = id;

        this.game.addPlayer(newEntity);
      }
      else {
        this.game[collectionName][id].x = worldState[collectionName][id].x;
        this.game[collectionName][id].y = worldState[collectionName][id].y;
        this.game[collectionName][id].direction = worldState[collectionName][id].direction;
      }
    }
  };

  Client.prototype.handleKeyDown = function (e) {
    var shouldPreventDefault = false;

    // Force player to move at only one direction
    // no diagonals allowed
    if (this.isDirectionKey(e.keyCode)) {
      this.resetPressedDirectionalKeys();
      shouldPreventDefault = true;
    }

    // Prevent default for arrows and space key
    // so browser won't move when playing
    if (shouldPreventDefault || e.keyCode === Client.keyCodes.SPACE) {
      e.preventDefault();
    }

    this.keyboardState[e.keyCode] = true;
  };

  Client.prototype.handleKeyUp = function (e) {
    delete this.keyboardState[e.keyCode];
  };

  // Prevent keys from staying pressed when window loses focus
  Client.prototype.handleBlur = function () {
    this.keyboardState = {};
  };

  Client.prototype.isDirectionKey = function (keyCode) {
    return keyCode === Client.keyCodes.UP   ||
           keyCode === Client.keyCodes.DOWN ||
           keyCode === Client.keyCodes.LEFT ||
           keyCode === Client.keyCodes.RIGHT;
  };

  Client.prototype.resetPressedDirectionalKeys = function () {
    delete this.keyboardState[Client.keyCodes.UP];
    delete this.keyboardState[Client.keyCodes.DOWN];
    delete this.keyboardState[Client.keyCodes.LEFT];
    delete this.keyboardState[Client.keyCodes.RIGHT];
  };

  Client.prototype.render = function () {
    if (!this.floorImg.isLoaded) {
      return;
    }
    this.ctx.beginPath();
    this.ctx.fillStyle = this.floorPattern;
    this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fill();

    for (var id in this.game.projectiles) {
      this.game.projectiles[id].render(this.ctx);
    }

    this.renderSolidTiles();
    this.renderEnemies();

    this.renderPlayer();
  };

  Client.prototype.renderPlayer = function () {
    if (!this.player) {
      return;
    }

    this.player.render(this.ctx);

    // Draw triangle on top of player
    this.ctx.strokeStyle = '008000';
    this.ctx.fillStyle = '#0f0';
    this.ctx.beginPath();
    this.ctx.moveTo(this.player.x + (Player.renderedWidth / 2) - 5, this.player.y - 15);
    this.ctx.lineTo(this.player.x + (Player.renderedWidth / 2) + 5, this.player.y - 15);
    this.ctx.lineTo(this.player.x + (Player.renderedWidth / 2), this.player.y - 5);
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.stroke();
  };

  Client.prototype.renderEnemies = function () {
    if (!this.player) {
      return;
    }

    for (var playerId in this.game.players) {
      if (parseInt(playerId, 10) !== this.player.id) {
        this.game.players[playerId].render(this.ctx);
      }
    }
  };

  Client.prototype.renderSolidTiles = function () {
    for (var i = 0; i < this.game.solidTiles.length; i++) {
      this.game.solidTiles[i].render(this.ctx);
    }
  };

  Client.prototype.update = function () {
    this.processInputs();
    this.render();
  };

  Client.prototype.processInputs = function () {
    var now = Date.now(),
        deltaModifier = (now - (this.lastInputTime ? this.lastInputTime : now)) / 1000;

    this.lastInputTime = now;

    if (deltaModifier < 1) {
      this.game.update(deltaModifier);
    }

    if (!this.hasNewInput()) {
      // nothing new to send
      return;
    }

    // need a truly new object to prevent
    // multiple inputs sharing state
    var input = this.keyboardStateClone();
    input.deltaModifier = deltaModifier;
    input.entityId = this.entityId;
    input.inputNumber = this.inputNumber++;
    input.t = now;

    // client prediction
    // apply input to entity for instant feedback
    this.game.applyInput(this.player.id, input);
  };

  Client.prototype.keyboardStateClone = function () {
    return {
      LEFT: this.keyboardState[Client.keyCodes.LEFT],
      RIGHT: this.keyboardState[Client.keyCodes.RIGHT],
      UP: this.keyboardState[Client.keyCodes.UP],
      DOWN: this.keyboardState[Client.keyCodes.DOWN],
      SPACE: this.keyboardState[Client.keyCodes.SPACE]
    };
  };

  Client.prototype.hasNewInput = function () {
    return !!(this.keyboardState[Client.keyCodes.LEFT]  ||
              this.keyboardState[Client.keyCodes.RIGHT] ||
              this.keyboardState[Client.keyCodes.UP]    ||
              this.keyboardState[Client.keyCodes.DOWN]  ||
              this.keyboardState[Client.keyCodes.SPACE]);
  };

  return Client;
}());
