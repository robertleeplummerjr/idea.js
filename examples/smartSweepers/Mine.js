var Mine = (function() {
  "use strict";

  function Mine(x, y) {
    this.position = new Point(x, y);
  }

  Mine.prototype = {
    worldTransform: function() {
      var points = [
        {x: -1, y: -1},
        {x: -1, y: 1},
        {x: 1, y: 1},
        {x: 1, y: -1}
      ];

      return (new Matrix2d())
        .scale(Mine.config.scale, Mine.config.scale)
        .translate(this.position.x, this.position.y)
        .transformPoints(points);
    },
    distance: function(entity) {
      return this.position.distance(entity.position);
    }
  };

  Mine.config = {
    scale: 2
  };

  return Mine;
})();