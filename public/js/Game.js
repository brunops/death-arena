/* global Player, Projectile, SolidTile, io */
(function () {
  'use strict';

  var Game = {
    // Key codes lookup
    keyCodes: {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      SPACE: 32
    },

    // current keyboard state
    keysDown: {},

    // store all projectiles
    projectiles: [],

    // Tile game obstacles
    solidTiles: [],

    // Store timestamp with player last shot
    lastShot: 0,

    enemies: {},

    // Cooldown between Player shots in ms
    projectileCooldown: 500,

    init: function () {
      Game.socket = io.connect(window.location.origin);

      Game.defineCanvas();
      Game.createSolidTiles();

      Game.bind();
    },

    defineCanvas: function () {
      Game.canvas = document.getElementById('canvas');
      Game.ctx = Game.canvas.getContext('2d');

      Game.canvas.width = 640;//Game.canvas.clientWidth;
      Game.canvas.height = 520;//Game.canvas.clientHeight;

      Game.floorImg = new Image();
      Game.floorImg.src = 'images/floortile11.bmp';
      Game.floorImg.isLoaded = false;
      Game.floorImg.onload = function () {
        Game.floorPattern = Game.ctx.createPattern(Game.floorImg, 'repeat');
        Game.floorImg.isLoaded = true;
      };
    },

    bind: function () {
      document.addEventListener('keydown', function (e) {
        // Force player to move at only one direction
        // no diagonals allowed
        if (Game.isDirectionKey(e.keyCode)) {
          Game.resetPressedDirectionalKeys();
        }

        Game.keysDown[e.keyCode] = true;
      }, false);

      document.addEventListener('keyup', function (e) {
        delete Game.keysDown[e.keyCode];
      }, false);

      // Prevent keys from staying pressed when window loses focus
      window.addEventListener('blur', function () {
        Game.keysDown = {};
      }, false);

      Game.socket.on('start', function (data) {
        Game.player = new Player(data.player);

        for (var enemyId in data.enemies) {
          Game.enemies[enemyId] = new Player(data.enemies[enemyId]);
        }
      });

      Game.socket.on('player-connect', function (data) {
        Game.enemies[data.id] = new Player(data.player);
      });

      Game.socket.on('player-disconnect', function (data) {
        delete Game.enemies[data.id];
      });

      Game.socket.on('enemies-sync', function (data) {
        for (var enemy in data) {
          if (Game.enemies[enemy]) {
            Game.enemies[enemy].x = data[enemy].x;
            Game.enemies[enemy].y = data[enemy].y;
            Game.enemies[enemy].direction = data[enemy].direction;
            Game.enemies[enemy].updateSprite();
          }
        }
      });
    },

    update: function (modifier) {
      Game.handleInput(modifier);
      Game.updateProjectiles(modifier);
    },

    handleInput: function (modifier) {
      if (!Game.player) {
        return;
      }

      var isMoving = false,
          player = Game.player,
          now = Date.now(),
          oldX = player.x,
          oldY = player.y;

      if (modifier > 1000) {
        return;
      }

      // UP
      if (Game.keysDown[Game.keyCodes.UP]) {
        if (!isMoving) {
          player.direction = 'up';
          isMoving = true;
        }

        // Prevent player form going out of bounds
        if (player.y > 0) {
          player.y = player.y - (player.speed * modifier);
        }
      }

      // DOWN
      if (Game.keysDown[Game.keyCodes.DOWN]) {
        if (!isMoving) {
          player.direction = 'down';
          isMoving = true;
        }

        // Prevent player form going out of bounds
        if (player.y < Game.canvas.height - Player.height) {
          player.y = player.y + (player.speed * modifier);
        }
      }

      // RIGHT
      if (Game.keysDown[Game.keyCodes.RIGHT]) {
        if (!isMoving) {
          player.direction = 'right';
          isMoving = true;
        }

        // Prevent player form going out of bounds
        if (player.x < Game.canvas.width - Player.width) {
          player.x = player.x + (player.speed * modifier);
        }
      }

      // LEFT
      if (Game.keysDown[Game.keyCodes.LEFT]) {
        if (!isMoving) {
          player.direction = 'left';
          isMoving = true;
        }

        // Prevent player form going out of bounds
        if (player.x > 0) {
          player.x = player.x - (player.speed * modifier);
        }
      }

      // Reset player position if collided with a tile
      if (Game.isCollidedWithTile(player)) {
        player.x = oldX;
        player.y = oldY;
      }

      // SPACE
      if (Game.keysDown[Game.keyCodes.SPACE]) {
        if (Game.projectileCooldown < now - Game.lastShot) {
          Game.lastShot = now;

          // Centralize fireball in respect to player
          Game.projectiles.push(new Projectile({
            direction: player.direction,
            x: player.x + (Player.renderedWidth / 2 - Projectile.renderedWidth / 2),
            y: player.y + (Player.renderedHeight / 2 - Projectile.renderedHeight / 2)
          }));
        }
      }

      if (isMoving) {
        player.updateSprite();

        Game.socket.emit('player-move', {
          x: Game.player.x,
          y: Game.player.y,
          direction: Game.player.direction
        });
      }
    },

    isDirectionKey: function (keyCode) {
      return keyCode === Game.keyCodes.UP   ||
             keyCode === Game.keyCodes.DOWN ||
             keyCode === Game.keyCodes.LEFT ||
             keyCode === Game.keyCodes.RIGHT;
    },

    resetPressedDirectionalKeys: function () {
      delete Game.keysDown[Game.keyCodes.UP];
      delete Game.keysDown[Game.keyCodes.DOWN];
      delete Game.keysDown[Game.keyCodes.LEFT];
      delete Game.keysDown[Game.keyCodes.RIGHT];
    },

    updateProjectiles: function (modifier) {
      var projectiles = Game.projectiles;

      for (var i = 0; i < projectiles.length; ++i) {
        switch (projectiles[i].direction) {
          case 'up':
            projectiles[i].y -= projectiles[i].speed * modifier;
            break;
          case 'down':
            projectiles[i].y += projectiles[i].speed * modifier;
            break;
          case 'right':
            projectiles[i].x += projectiles[i].speed * modifier;
            break;
          case 'left':
            projectiles[i].x -= projectiles[i].speed * modifier;
            break;
        }

        // Delete projectile if out of bounds or collided with a tile
        // a.k.a. leave to garbage collector
        if (projectiles[i].x < -Projectile.width  ||
            projectiles[i].x > Game.canvas.width  ||
            projectiles[i].y < -Projectile.height ||
            projectiles[i].y > Game.canvas.height ||
            Game.isCollidedWithTile(projectiles[i])) {
          projectiles.splice(i--, 1);
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

    render: function () {
      if (!Game.floorImg.isLoaded) {
        return;
      }
      Game.ctx.beginPath();
      Game.ctx.fillStyle = Game.floorPattern;
      Game.ctx.rect(0, 0, Game.canvas.width, Game.canvas.height);
      Game.ctx.fill();

      for (var i = 0; i < Game.projectiles.length; ++i) {
        Game.projectiles[i].render(Game.ctx);
      }

      Game.renderSolidTiles();
      Game.renderEnemies();

      Game.renderPlayer();
    },

    renderPlayer: function () {
      if (!Game.player) {
        return;
      }

      Game.player.render(Game.ctx);

      // Draw triangle on top of player
      Game.ctx.strokeStyle = '008000';
      Game.ctx.fillStyle = '#0f0';
      Game.ctx.beginPath();
      Game.ctx.moveTo(Game.player.x + (Player.renderedWidth / 2) - 5, Game.player.y - 15);
      Game.ctx.lineTo(Game.player.x + (Player.renderedWidth / 2) + 5, Game.player.y - 15);
      Game.ctx.lineTo(Game.player.x + (Player.renderedWidth / 2), Game.player.y - 5);
      Game.ctx.fill();
      Game.ctx.closePath();
      Game.ctx.stroke();
    },

    renderEnemies: function () {
      for (var enemyId in Game.enemies) {
        Game.enemies[enemyId].render(Game.ctx);
      }
    },

    createSolidTiles: function () {
      var x = 60, y = 60;
      while (y < Game.canvas.height - 60) {
        x = 60;
        while (x < Game.canvas.width - 60) {
          Game.solidTiles.push(new SolidTile({
            x: x,
            y: y,
            color: 'gray'
          }));
          x += 120;
        }
        y += 120;
      }

      // remove middle solid tiles
      Game.solidTiles.splice(6, 3);
      Game.solidTiles.splice(8, 3);
    },

    renderSolidTiles: function () {
      for (var i = 0; i < Game.solidTiles.length; i++) {
        Game.solidTiles[i].render(Game.ctx);
      }
    }
  };

  // make Game globally accessible
  window.Game = Game;
}());
