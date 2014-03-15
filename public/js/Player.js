/* global Entity */
(function () {
  'use strict';

  var Player = Entity.extend({
    x: 50,
    y: 50,
    width: 30,
    height: 52,
    speed: 150,
    frameCooldown: 150,
    spriteSrc: 'public/images/heroes.png',
    spritePositions: {
      'down':  [[10, 12], [57, 12],  [105, 12], [57, 12]],
      'left':  [[10, 75], [57, 75],  [105, 75], [57, 75]],
      'right': [[10, 140], [57, 140], [105, 140], [57, 140]],
      'up':    [[10, 205], [57, 205], [105, 205], [57, 205]]
    },
    direction: 'down'
  });

  window.Player = Player;
}());
