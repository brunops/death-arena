/* global Player, Projectile */
window.requestAnimFrame = (function () {
  'use strict';
  return window.requestAnimationFrame       ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         function (callback) {
           window.setTimeout(callback, 1000 / 60);
         };
})();

(function () {
  'use strict';

  var player = new Player({
    x: 100,
    y: 200
  });

  var projectiles = [];

  function updateScene(modifier) {
    var dirChanged = false;

    if (modifier < 1000) {
      // UP
      if (keysDown[38]) {
        if (!dirChanged) {
          player.direction = 'up';
          dirChanged = true;
        }

        player.y = player.y - (player.speed * modifier);
      }

      // DOWN
      if (keysDown[40]) {
        if (!dirChanged) {
          player.direction = 'down';
          dirChanged = true;
        }

        player.y = player.y + (player.speed * modifier);
      }

      // RIGHT
      if (keysDown[39]) {
        if (!dirChanged) {
          player.direction = 'right';
          dirChanged = true;
        }

        player.x = player.x + (player.speed * modifier);
      }

      // LEFT
      if (keysDown[37]) {
        if (!dirChanged) {
          player.direction = 'left';
          dirChanged = true;
        }

        player.x = player.x - (player.speed * modifier);
      }

      // SPACE
      if (keysDown[32]) {
        // Centralize fireball in respect to player
        projectiles.push(new Projectile({
          direction: player.direction,
          x: player.x + (Player.renderedWidth / 2 - Projectile.renderedWidth / 2),
          y: player.y + (Player.renderedHeight / 2 - Projectile.renderedHeight / 2)
        }));
      }

      if (dirChanged) {
        player.update();
      }

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
    }
  }

  var ctx = document.getElementById('canvas').getContext('2d');

  var before = Date.now();
  window.requestAnimFrame(function update() {
    var now = Date.now(),
        delta = now - before,
        modifier = delta / 1000;

    updateScene(modifier);
    ctx.clearRect(0, 0, 512, 480);

    for (var i = 0; i < projectiles.length; ++i) {
      projectiles[i].render(ctx);
    }
    player.render(ctx);

    before = now;
    window.requestAnimFrame(update);
  });

  var keysDown = {};
  document.addEventListener('keydown', function (e) {
    keysDown = {};
    keysDown[e.keyCode] = true;
  }, false);

  document.addEventListener('keyup', function (e) {
    delete keysDown[e.keyCode];
  }, false);

}());
