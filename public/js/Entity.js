(function () {
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

  window.Entity = Entity;
}());
