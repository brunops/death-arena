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

    lastUpdate: null,

    // Cooldown between shots of same player in ms
    shotCooldown: 500,

    init: function (width, height) {
      // define world size
      Game.width = width;
      Game.height = height;

      Game.createSolidTiles();
    },

    update: function () {
      var now = Date.now(),
          deltaModifier = (now - Game.lastUpdate) / 1000.0;

      Game.lastUpdate = now;

      Game.updateProjectiles(deltaModifier);
    },

    updateProjectiles: function (deltaModifier) {
      var projectiles = Game.projectiles;

      for (var id in projectiles) {
        switch (projectiles[id].direction) {
          case 'up':
            projectiles[id].y -= projectiles[id].speed * deltaModifier;
            break;
          case 'down':
            projectiles[id].y += projectiles[id].speed * deltaModifier;
            break;
          case 'right':
            projectiles[id].x += projectiles[id].speed * deltaModifier;
            break;
          case 'left':
            projectiles[id].x -= projectiles[id].speed * deltaModifier;
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
      var id = player ? player.id : null;
      if (!player || typeof player !== 'Player') {
        player = new Player(player);
      }

      player.id = id || Game.nextPlayerId++;

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
        if (player.x < Game.width - Player.renderedWidth) {
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
          id: parseInt(id, 10),
          direction: Game.projectiles[id].direction,
          x: parseFloat(Game.projectiles[id].x.toFixed(2)),
          y: parseFloat(Game.projectiles[id].y.toFixed(2))
        });
      }

      for (id in Game.players) {
        worldState.players.push({
          id: parseInt(id, 10),
          direction: Game.players[id].direction,
          x: parseFloat(Game.players[id].x.toFixed(2)),
          y: parseFloat(Game.players[id].y.toFixed(2))
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
