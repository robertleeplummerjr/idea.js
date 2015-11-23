var GeorgeController = (function() {
  function GeorgeController(settings) {
    settings = settings || {};

    var self = this,
      defaults = GeorgeController.defaults,
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
    this.hive = new idea.Hive({
      count: settings.count,
      initType: function() {
        return new George(self.route);
      }
    });
  }

  GeorgeController.prototype = {
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
        hive = this.hive,
        settings = this.settings,
        max = settings.count;

      if (this.ticks++ < settings.dayTicks) {
        for (; i < max; i++) {
          salesman = hive.collection[i];
          salesman.brain.think();
          if (this.foundShortestRoute === null) {
            this.foundShortestRoute = salesman.route;
          }
          if (salesman.route.distance < this.foundShortestRoute.distance) {
            this.foundShortestRoute = salesman.route;
          }
        }
      } else {
        this.beginNewDay();
      }

      this.render();

      return this;
    },

    beginNewDay: function() {
      this.hive
        .calcStats()
        .learn()
        .resetStats();

      this.day++;
      this.ticks = 0;

      return this;
    }
  };

  GeorgeController.defaults = {
    ctx: null,
    count: 30,
    points: 20,
    width: 1,
    height: 1,
    dayTicks: 20
  };

  return GeorgeController;
})();