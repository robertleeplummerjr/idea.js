var JerryController = (function() {
  function JerryController(settings) {
    var defaults = JerryController.defaults,
      _settings = {},
      points,
      graph,
      max,
      point,
      i;

    for (i in defaults) {
      if (defaults.hasOwnProperty(i)) {
        _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
      }
    }

    this.settings = settings = _settings;
    this.colony = new idea.Colony({
      strategy: idea.Colony.maxminStrategy,
      Type: Jerry
    });

    points = settings.route.points;
    max = points.length;
    graph = this.colony.graph;
    i = 0;
    for (; i < max; i++) {
      point = points[i];
      graph.addPoint(point.x, point.y);
      graph.createEdges();
    }
    this.colony.reset();
  }

  JerryController.prototype = {
    drawRoute: function() {
      if (this.colony.globalBest === null) return this;
      var settings = this.settings,
        ant = this.colony.globalBest,
        points = ant.tour.points,
        point = points,
        ctx = settings.ctx,
        i = 0,
        max = points.length,
        lastPoint = points[max - 1];

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgb(255, 247, 0)';

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      for (;i < max; i++) {
        point = points[i];
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
      return this;
    },
    update: function() {
      this.colony.step();
      return this;
    }
  };

  JerryController.defaults = {
    ctx: null,
    count: 30,
    route: null,
    width: 1,
    height: 1
  };

  return JerryController;
})();