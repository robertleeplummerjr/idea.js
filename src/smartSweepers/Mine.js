smartSweepers.Mine = (function() {
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
        .scale(Mine.config.mineScale, Mine.config.mineScale)
        .translate(this.position.x, this.position.y)
        .transformPoints(points);
    }
  };

  Mine.config = {
    mineScale: 2
  };

  return Mine;
})();