/* global Entity */
(function () {
  'use strict';

  var SolidTile = Entity.extend({
    width: 32,
    height: 32,
    spriteSrc: 'images/solid-tile4.png'
  });

  window.SolidTile = SolidTile;
}());
