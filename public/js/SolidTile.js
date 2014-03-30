/* global module, require */
var Entity = require('./Entity');

module.exports = (function () {
  'use strict';

  var SolidTile = Entity.extend({
    width: 32,
    height: 32,
    spriteSrc: 'images/solid-tile4.png'
  });

  return SolidTile;
}());
