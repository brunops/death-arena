/* global Entity */
(function () {
  'use strict';

  var Projectile = Entity.extend({
    width: 48,
    height: 36,
    speed: 400,
    spriteSrc: 'public/images/fireball.png'
  });

  // Make Projectile globally available
  window.Projectile = Projectile;
}());
