(function () {
  'use strict';

  function entityCreator(options) {
    function NewEntity() {
      Entity.call(this, options);
    }

    NewEntity.prototype = new Entity();
    NewEntity.prototype.constructor = NewEntity;

    return NewEntity;
  }

  function Entity(options) {
    this.init(options);
  }

  Entity.prototype.init = function (options) {
    options = options || {};

    // Constructor properties
    // shared among all instances
    this.constructor.width = options.width || 32;
    this.constructor.height = options.height || 32;

    this.constructor.renderedWidth = options.renderedWidth ||
                                     this.constructor.width;

    this.constructor.renderedHeight = options.renderedHeight ||
                                      this.constructor.height;

    this.constructor.spritePositions = options.spritePositions ||
                                       this.constructor.spritePositions ||
                                       {
                                         'down': [[0, 0]],
                                         'left': [[0, 0]],
                                         'right': [[0, 0]],
                                         'up': [[0, 0]]
                                       };

    this.constructor.frameCooldown = options.frameCooldown ||
                                     this.constructor.frameCooldown ||
                                     150;

    this.constructor.totalFrames = this.constructor.spritePositions.right[0].length;

    // Object exclusive Properties
    this.x = options.x || 0;
    this.y = options.y || 0;

    // assumes same number of sprites for every direction
    this.direction = options.direction || 'right';
    this.currentFrame = options.currentFrame || 0;
    this.lastFrameUpdate = Date.now();
    this.speed = options.speed || 100;

    if (options.spriteSrc) {
      this.loadSprite(options.spriteSrc);
    }
  };

  Entity.prototype.loadSprite = function (spriteSrc) {
    if (this.constructor.spriteLoaded) {
      return;
    }

    var self = this;

    this.constructor.spriteLoaded = false;
    this.constructor.sprite = new Image();
    this.constructor.sprite.src = spriteSrc;

    this.constructor.sprite.onload = function () {
      self.constructor.spriteLoaded = true;
    };
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

  Entity.prototype.update = function (now) {
    now = now || Date.now();

    if (now - this.lastFrameUpdate > this.constructor.frameCooldown) {
      this.currentFrame += 1;
      this.lastFrameUpdate = now;
      if (this.constructor.totalFrames <= this.currentFrame) {
        this.currentFrame = 0;
      }
    }
  };

  window.entityCreator = entityCreator;
}());
