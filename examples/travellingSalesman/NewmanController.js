var NewmanController = (function() {
  function NewmanController(settings) {
    settings = settings || {};

    var self = this,
      defaults = NewmanController.defaults,
      _settings = {},
      i;
    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }
    this.settings = settings = _settings;
    this.day = 0;
    this.ticks = 0;
    this.route = (new Route()).createRandom({
      count: settings.points,
      height: settings.height,
      width: settings.width
    });
    this.foundShortestRoute = null;
    this.mh = new idea.MetaHeuristic({
      possibilities: this.route,
      count: settings.count,
      goal: function() {
        var experimentalRoute = self.experimentalRoute,
          d = experimentalRoute.updateDistance().distance,
          count = experimentalRoute.intersectCount(),
          reward = 0;

        if (d < self.previousDistance) {
          self.previousDistance = d;
          self.route = experimentalRoute;
          reward++;
        }

        if (count < self.previousIntersects) {
          reward++;
        }

        return reward;
      }
    });
  }

  NewmanController.prototype = {
    render: function() {
      return this
        .drawBackground()
        .drawPoints()
        .drawRoute();
    },
    drawBackground: function() {
      var settings = this.settings,
        ctx = settings.ctx;

      ctx.clearRect(0, 0, settings.width, settings.height);
      ctx.beginPath();
      ctx.rect(0, 0, settings.width, settings.height);
      ctx.fillStyle = 'rgb(32, 36, 45)';
      ctx.fill();

      return this;
    },
    drawPoints: function() {
      var settings = this.settings,
        points = this.route.points,
        point,
        ctx = settings.ctx,
        i = 0,
        max = points.length;

      ctx.strokeStyle = 'rgb(255, 45, 3)';
      for (; i < max; i++) {
        point = points[i];
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
      }
      return this;
    },
    drawRoute: function() {
      if (this.foundShortestRoute === null) return this;
      var settings = this.settings,
        points = this.foundShortestRoute.points,
        point = points,
        ctx = settings.ctx,
        i = 0,
        max = points.length,
        lastPoint = points[max - 1];

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgb(255, 196, 0)';

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
      var i = 0,
        salesman,
        mh = this.mh,
        settings = this.settings,
        max = settings.count;

      for (; i < max; i++) {
        salesman = mh.collection[i];
        salesman.brain.think();
        if (this.foundShortestRoute === null) {
          this.foundShortestRoute = salesman.route;
        }
        if (salesman.route.distance < this.foundShortestRoute.distance) {
          this.foundShortestRoute = salesman.route;
        }
      }

      this.render();

      return this;
    }
  };

  NewmanController.defaults = {
    ctx: null,
    count: 30,
    points: 20,
    width: 1,
    height: 1
  };

  return NewmanController;
})();