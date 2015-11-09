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
        .scale(this.params.mineScale, this.params.mineScale)
        .translate(this.position.x, this.position.y)
        .transformPoints(points);
    }
  };

  return Mine;
})();