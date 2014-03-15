/* global Player, Projectile */
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

    // Store timestamp with player last shot
    lastShot: 0,

    // Cooldown between Player shots in ms
    projectileCooldown: 500,

    init: function () {
      Game.player = new Player({
        x: 100,
        y: 200
      });

      Game.defineCanvas();
      Game.bind();
    },

    defineCanvas: function () {
      Game.canvas = document.getElementById('canvas');
      Game.ctx = Game.canvas.getContext('2d');

      Game.canvas.width = Game.canvas.clientWidth;
      Game.canvas.height = Game.canvas.clientHeight;
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
    },

    update: function (modifier) {
      Game.handleInput(modifier);
      Game.updateProjectiles(modifier);
    },

    handleInput: function (modifier) {
      var dirChanged = false,
          player = Game.player,
          now = Date.now();

      if (modifier > 1000) {
        return;
      }

      // UP
      if (Game.keysDown[Game.keyCodes.UP]) {
        if (!dirChanged) {
          player.direction = 'up';
          dirChanged = true;
        }

        player.y = player.y - (player.speed * modifier);
      }

      // DOWN
      if (Game.keysDown[Game.keyCodes.DOWN]) {
        if (!dirChanged) {
          player.direction = 'down';
          dirChanged = true;
        }

        player.y = player.y + (player.speed * modifier);
      }

      // RIGHT
      if (Game.keysDown[Game.keyCodes.RIGHT]) {
        if (!dirChanged) {
          player.direction = 'right';
          dirChanged = true;
        }

        player.x = player.x + (player.speed * modifier);
      }

      // LEFT
      if (Game.keysDown[Game.keyCodes.LEFT]) {
        if (!dirChanged) {
          player.direction = 'left';
          dirChanged = true;
        }

        player.x = player.x - (player.speed * modifier);
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

      if (dirChanged) {
        player.update();
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
      }
    },

    render: function () {
      Game.ctx.clearRect(0, 0, Game.canvas.width, Game.canvas.height);

      for (var i = 0; i < Game.projectiles.length; ++i) {
        Game.projectiles[i].render(Game.ctx);
      }
      Game.player.render(Game.ctx);
    }
  };

  // make Game globally accessible
  window.Game = Game;
}());
