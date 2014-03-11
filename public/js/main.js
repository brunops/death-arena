(function () {
  'use strict';

  function Player(options) {
    this.init(options);
  }

  Player.prototype.init = function (options) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.direction = options.direction || 'right';

    var self = this;
    this.spriteLoaded = false;
    this.sprite = new Image();
    this.sprite.src = 'public/images/heroes.png';
    this.sprite.onload = function () {
      self.spriteLoaded = true;
    };

    this.speed = options.speed || 150; // pixels per second
    this.currentFrame = 0;
    this.lastFrameUpdate = 0;
  };

  Player.width = 30;
  Player.height = 52;

  Player.spritePositions = {
    'down':  [[10, 12], [57, 12],  [105, 12], [57, 12]],
    'left':  [[10, 75], [57, 75],  [105, 75], [57, 75]],
    'right': [[10, 140], [57, 140], [105, 140], [57, 140]],
    'up':    [[10, 205], [57, 205], [105, 205], [57, 205]]
  };

  Player.frameCooldown = 150;


  Player.prototype.update = function (now) {
    now = now || Date.now();

    if (now - this.lastFrameUpdate > Player.frameCooldown) {
      this.currentFrame += 1;
      this.lastFrameUpdate = now;
      if (4 <= this.currentFrame) {
        this.currentFrame = 0;
      }
    }
  };

  Player.prototype.render = function (ctx) {
    if (this.spriteLoaded) {
      ctx.drawImage(
        this.sprite,
        Player.spritePositions[this.direction][this.currentFrame][0],
        Player.spritePositions[this.direction][this.currentFrame][1],
        Player.width,
        Player.height,
        this.x,
        this.y,
        Player.width,
        Player.height
      );
    }
  };

  window.Player = Player;

}());

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

  var player = new window.Player({
    x: 50,
    y: 50
  });

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
      if (dirChanged)
        player.update();
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
