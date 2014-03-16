/* global Entity */
(function () {
  'use strict';

  var SolidTile = Entity.extend({
    width: 40,
    height: 40
  });

  SolidTile.color = 'gray';

  window.SolidTile = SolidTile;
}());
