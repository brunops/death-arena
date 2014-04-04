/* global require */
window.requestAnimFrame = (function () {
  'use strict';
  return window.requestAnimationFrame       ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         function (callback) {
           window.setTimeout(callback, 1000 / 60);
         };
})();

var Client = require('./Client');

(function () {
  'use strict';

  var client = new Client(640, 520);

  window.requestAnimFrame(function update() {
    client.update();
    window.requestAnimFrame(update);
  });

  setInterval(client.sendNewInputs.bind(client), 1000);

}());
