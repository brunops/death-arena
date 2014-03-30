(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global module, require */
var Player = require('./Player'),
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
    this.player = this.game.addPlayer();

    // current keyboard state
    this.keyboardState = {};

    this.defineCanvas(width, height);
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
    for (var player in this.game.players) {
      this.game.players[player].render(this.ctx);
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
    this.game.update(deltaModifier);

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

},{"./Game":3,"./Player":4}],2:[function(require,module,exports){
/* global module */
module.exports = (function () {
  'use strict';

  function Entity(options) {
    this.init(options);
  }

  Entity.extend = function (options) {

    function Surrogate() {
      Entity.apply(this, arguments);
    }

    // Constructor properties
    // shared among all instances
    Surrogate.width = options.width || 32;
    Surrogate.height = options.height || 32;

    Surrogate.renderedWidth = options.renderedWidth ||
                              Surrogate.width;

    Surrogate.renderedHeight = options.renderedHeight ||
                               Surrogate.height;

    Surrogate.spritePositions = options.spritePositions ||
                                Surrogate.spritePositions ||
                                {
                                  'down': [[0, 0]],
                                  'left': [[0, 0]],
                                  'right': [[0, 0]],
                                  'up': [[0, 0]]
                                };

    Surrogate.frameCooldown = options.frameCooldown ||
                              Surrogate.frameCooldown ||
                              150;

    Surrogate.totalFrames = Surrogate.spritePositions.right.length || 0;

    Surrogate.speed = options.speed || 100;

    if (options.spriteSrc) {
      Surrogate.spriteLoaded = false;
      Surrogate.sprite = new Image();
      Surrogate.sprite.src = options.spriteSrc;

      Surrogate.sprite.onload = function () {
        Surrogate.spriteLoaded = true;
      };
    }

    Surrogate.prototype = new Entity();
    Surrogate.prototype.constructor = Surrogate;

    return Surrogate;
  };

  Entity.prototype.init = function (options) {
    options = options || {};

    // Object exclusive Properties
    this.x = options.x || 0;
    this.y = options.y || 0;

    // Store Entity last position
    // so updateSprite can determine if entity has moved
    this.lastX = this.x;
    this.lastY = this.y;

    // assumes same number of sprites for every direction
    this.direction = options.direction || 'right';
    this.currentFrame = options.currentFrame || 0;
    this.lastFrameUpdate = Date.now();
    this.speed = options.speed || this.constructor.speed || 100;
  };

  Entity.prototype.render = function (context) {
    if (this.constructor.spriteLoaded) {
      context.drawImage(
        this.constructor.sprite,
        this.constructor.spritePositions[this.direction][this.currentFrame][0],
        this.constructor.spritePositions[this.direction][this.currentFrame][1],
        this.constructor.width,
        this.constructor.height,
        this.x,
        this.y,
        this.constructor.renderedWidth,
        this.constructor.renderedHeight
      );
    }
  };

  Entity.prototype.setX = function (x) {
    this.lastX = this.x;
    this.x = x;
  };

  Entity.prototype.setY = function (y) {
    this.lastY = this.y;
    this.y = y;
  };

  Entity.prototype.hasMoved = function () {
    return this.x !== this.lastX || this.y !== this.lastY;
  };

  Entity.prototype.updateSprite = function (now) {
    now = now || Date.now();

    if (this.hasMoved() && now - this.lastFrameUpdate > this.constructor.frameCooldown) {
      this.currentFrame += 1;
      this.lastFrameUpdate = now;
      if (this.constructor.totalFrames <= this.currentFrame) {
        this.currentFrame = 0;
      }
    }
  };

  // allow a little bit of proximity between entities before considering
  // a collision, it improves the experience, otherwise some
  // entities seem to collide before expected
  Entity.adjust = 5;
  Entity.prototype.isCollided = function (entity2) {
    // no collision if there's any gap
    return !(this.x + this.constructor.renderedWidth - Entity.adjust <= entity2.x ||
      this.x > entity2.x + entity2.constructor.renderedWidth - Entity.adjust      ||
      this.y + this.constructor.renderedHeight - Entity.adjust <= entity2.y       ||
      this.y > entity2.y + entity2.constructor.renderedHeight - Entity.adjust
    );
  };

  return Entity;
}());

},{}],3:[function(require,module,exports){
/* global module, require */
var Player     = require('./Player');
var Projectile = require('./Projectile');
var SolidTile  = require('./SolidTile');

module.exports = (function () {
  'use strict';

  var Game = {
    // store all players alive
    // in an object with its id as key
    // for fast lookup
    players: {},

    // store all projectiles
    projectiles: {},

    // Tile game obstacles
    solidTiles: [],

    nextPlayerId: 0,

    nextProjectileId: 0,

    // Cooldown between shots of same player in ms
    shotCooldown: 500,

    init: function (width, height) {
      // define world size
      Game.width = width;
      Game.height = height;

      Game.createSolidTiles();
    },

    update: function (modifier) {
      Game.updateProjectiles(modifier);
    },

    updateProjectiles: function (modifier) {
      var projectiles = Game.projectiles;

      for (var id in projectiles) {
        switch (projectiles[id].direction) {
          case 'up':
            projectiles[id].y -= projectiles[id].speed * modifier;
            break;
          case 'down':
            projectiles[id].y += projectiles[id].speed * modifier;
            break;
          case 'right':
            projectiles[id].x += projectiles[id].speed * modifier;
            break;
          case 'left':
            projectiles[id].x -= projectiles[id].speed * modifier;
            break;
        }

        // Delete projectile if out of bounds or collided with a tile
        // a.k.a. leave to garbage collector
        if (projectiles[id].x < -Projectile.renderedWidth  ||
            projectiles[id].x > Game.width                 ||
            projectiles[id].y < -Projectile.renderedHeight ||
            projectiles[id].y > Game.height                ||
            Game.isCollidedWithTile(projectiles[id])) {
          delete projectiles[id];
        }
      }
    },

    isCollidedWithTile: function (entity) {
      for (var i = 0; i < Game.solidTiles.length; ++i) {
        if (entity.isCollided(Game.solidTiles[i])) {
          return true;
        }
      }

      return false;
    },

    createSolidTiles: function () {
      var x = 60,
          y = 60;

      while (y < Game.height - 60) {
        x = 60;
        while (x < Game.width - 60) {
          Game.solidTiles.push(new SolidTile({
            x: x,
            y: y
          }));
          x += 120;
        }
        y += 120;
      }

      // remove middle solid tiles
      Game.solidTiles.splice(6, 3);
      Game.solidTiles.splice(8, 3);
    },

    addPlayer: function (player) {
      player = player || new Player();

      if (typeof player.id === 'undefined') {
        player.id = Game.nextPlayerId++;
      }

      player.lastShot = 0;
      Game.players[player.id] = player;

      return player;
    },

    addProjectile: function (projectile) {
      if (typeof projectile.id === 'undefined') {
        projectile.id = Game.nextProjectileId++;
      }

      Game.projectiles[projectile.id] = projectile;

      return projectile;
    },

    applyInput: function (playerId, input) {
      var player = Game.players[playerId];

      if (!player) {
        return;
      }

      Game.applyPlayerInput(player, input);

      // SPACE
      // Trying to shoot
      if (input.SPACE) {
        Game.playerShot(player);
      }
    },

    applyPlayerInput: function (player, input) {
      var isMoving = true,
          oldX = player.x,
          oldY = player.y;

      // Chained if / else if
      // to make sure player is not allowed to
      // move diagonally
      if (input.UP) {
        player.direction = 'up';

        // Prevent Player from going out of bounds
        if (player.y > 0) {
          player.setY(player.y - (player.speed * input.deltaModifier));
        }
      }
      else if (input.DOWN) {
        player.direction = 'down';

        // Prevent Player from going out of bounds
        if (player.y < Game.height - Player.renderedHeight) {
          player.setY(player.y + (player.speed * input.deltaModifier));
        }
      }
      else if (input.RIGHT) {
        player.direction = 'right';

        // Prevent Player from going out of bounds
        if (player.y < Game.width - Player.renderedWidth) {
          player.setX(player.x + (player.speed * input.deltaModifier));
        }
      }
      else if (input.LEFT) {
        player.direction = 'left';

        // Prevent Player from going out of bounds
        if (player.x > 0) {
          player.setX(player.x - (player.speed * input.deltaModifier));
        }
      }
      else {
        isMoving = false;
      }

      // Reset player position if collided with a tile
      if (Game.isCollidedWithTile(player)) {
        player.setX(oldX);
        player.setY(oldY);
      }

      if (isMoving) {
        player.updateSprite();
      }
    },

    playerShot: function (player) {
      var now = Date.now();

      if (Game.shotCooldown < now - player.lastShot) {
        player.lastShot = now;

        // Centralize fireball in respect to player
        var newProjectile = {
          direction: player.direction,
          x: player.x + (Player.renderedWidth / 2 - Projectile.renderedWidth / 2),
          y: player.y + (Player.renderedHeight / 2 - Projectile.renderedHeight / 2)
        };

        Game.addProjectile(new Projectile(newProjectile));
      }
    },

    getWorldState: function () {
      var id,
          worldState = {
            players: [],
            projectiles: []
          };

      for (id in Game.projectiles) {
        worldState.projectiles.push({
          id: id,
          x: Game.projectiles[id].x,
          y: Game.projectiles[id].y
        });
      }

      for (id in Game.players) {
        worldState.players.push({
          id: id,
          x: Game.players[id].x,
          y: Game.players[id].y
        });
      }

      return worldState;
    }
  };

  return {
    init: Game.init,

    // direct access needed to allow rendering
    players: Game.players,

    // direct access needed to allow rendering
    projectiles: Game.projectiles,

    // direct access needed to allow rendering
    solidTiles: Game.solidTiles,

    // add a new player to the game
    // no player is special in here
    addPlayer: Game.addPlayer,

    // add a new projectile to the game
    addProjectile: Game.addProjectile,

    // apply raw input sent by client
    applyInput: Game.applyInput,

    // update entities positions
    // detect collision, update sprites, etc
    update: Game.update,

    // return current world state
    // as an object with all entities and its positions
    getWorldState: Game.getWorldState
  };

}());

},{"./Player":4,"./Projectile":5,"./SolidTile":6}],4:[function(require,module,exports){
/* global module, require */
var Entity = require('./Entity');

module.exports = (function () {
  'use strict';

  var Player = Entity.extend({
    x: 50,
    y: 50,
    width: 30,
    height: 52,
    speed: 150,
    frameCooldown: 150,
    spriteSrc: 'images/heroes.png',
    spritePositions: {
      'down':  [[10, 12], [57, 12],  [105, 12], [57, 12]],
      'left':  [[10, 75], [57, 75],  [105, 75], [57, 75]],
      'right': [[10, 140], [57, 140], [105, 140], [57, 140]],
      'up':    [[10, 205], [57, 205], [105, 205], [57, 205]]
    },
    renderedWidth: 25,
    renderedHeight: 46,
    direction: 'down'
  });

  return Player;
}());

},{"./Entity":2}],5:[function(require,module,exports){
/* global module, require */
var Entity = require('./Entity');

module.exports = (function () {
  'use strict';

  var Projectile = Entity.extend({
    width: 48,
    height: 36,
    speed: 400,
    spriteSrc: 'images/fireball.png',
    renderedWidth: 25,
    renderedHeight: 20
  });

  Projectile.directionAngles = {
    'left': 0,
    'up': 90,
    'right': 180,
    'down': 270
  };
  Projectile.TO_RADIANS = Math.PI / 180;

  Projectile.prototype.render = function (ctx) {
    ctx.save();
      var x = this.x + Projectile.renderedWidth / 2,
          y = this.y + Projectile.renderedHeight / 2;

      ctx.translate(x, y);
      ctx.rotate(Projectile.TO_RADIANS * Projectile.directionAngles[this.direction]);
      ctx.translate(-x, -y);
      Entity.prototype.render.call(this, ctx);
    ctx.restore();
  };

  return Projectile;
}());

},{"./Entity":2}],6:[function(require,module,exports){
/* global module, require */
var Entity = require('./Entity');

module.exports = (function () {
  'use strict';

  var SolidTile = Entity.extend({
    width: 32,
    height: 32,
    spriteSrc: 'images/solid-tile4.png'
  });

  return SolidTile;
}());

},{"./Entity":2}],7:[function(require,module,exports){
/* global require */
window.requestAnimFrame = (function () {
  'use strict';
  return window.requestAnimationFrame       ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         function (callback) {
           window.setTimeout(callback, 1000 / 60);
         };
})();

var Client = require('./Client');

(function () {
  'use strict';

  var client = new Client(640, 520);

  window.requestAnimFrame(function update() {
    client.update();
    window.requestAnimFrame(update);
  });

}());

},{"./Client":1}]},{},[7])