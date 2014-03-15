/* global Player, Projectile */
(function () {
  'use strict';

  var Game = {
    // current keyboard state
    keysDown: {},

    // store all projectiles
    projectiles: [],

    // Cooldown between Player shots in ms
    projectileCooldown: 150,

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
        Game.keysDown = {};
        Game.keysDown[e.keyCode] = true;
      }, false);

      document.addEventListener('keyup', function (e) {
        delete Game.keysDown[e.keyCode];
      }, false);
    },

    update: function (modifier) {
      Game.handleInput(modifier);
      Game.updateProjectiles(modifier);
    },

    handleInput: function (modifier) {
      var dirChanged = false,
          player = Game.player;

      if (modifier > 1000) {
        return;
      }

      // UP
      if (Game.keysDown[38]) {
        if (!dirChanged) {
          player.direction = 'up';
          dirChanged = true;
        }

        player.y = player.y - (player.speed * modifier);
      }

      // DOWN
      if (Game.keysDown[40]) {
        if (!dirChanged) {
          player.direction = 'down';
          dirChanged = true;
        }

        player.y = player.y + (player.speed * modifier);
      }

      // RIGHT
      if (Game.keysDown[39]) {
        if (!dirChanged) {
          player.direction = 'right';
          dirChanged = true;
        }

        player.x = player.x + (player.speed * modifier);
      }

      // LEFT
      if (Game.keysDown[37]) {
        if (!dirChanged) {
          player.direction = 'left';
          dirChanged = true;
        }

        player.x = player.x - (player.speed * modifier);
      }

      // SPACE
      if (Game.keysDown[32]) {
        // Centralize fireball in respect to player
        Game.projectiles.push(new Projectile({
          direction: player.direction,
          x: player.x + (Player.renderedWidth / 2 - Projectile.renderedWidth / 2),
          y: player.y + (Player.renderedHeight / 2 - Projectile.renderedHeight / 2)
        }));
      }

      if (dirChanged) {
        player.update();
      }
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
