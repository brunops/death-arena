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
