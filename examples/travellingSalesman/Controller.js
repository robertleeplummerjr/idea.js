var Controller = (function() {
  function Controller(settings) {
    settings = settings || {};

    var self = this,
      defaults = Controller.defaults,
      _settings = {},
      i;
    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }
    this.settings = settings = _settings;
    this.day = 0;
    this.ticks = 0;
    this.route = (new Route()).createRandom({
      count: settings.numPoints,
      height: settings.height,
      width: settings.width
    });

    this.hive = new idea.Hive({
      count: settings.numSalesmen,
      initType: function() {
        return new Salesman(self.route);
      }
    });
  }

  Controller.prototype = {
    render: function() {
      return this
        .drawBackground()
        .drawPoints()
        .drawEliteRoute();
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
    drawEliteRoute: function() {
      var settings = this.settings,
        hive = this.hive,
        elites = hive.elites,
        topEliteRoute = elites.length > 1 ? elites[0].experimentalRoute : hive.collection[0].experimentalRoute,
        points = topEliteRoute.points,
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
        max = settings.numSalesmen;

      if (this.ticks++ < settings.numTicks) {
        for (; i < max; i++) {
          salesman = hive.collection[i];
          salesman.brain.think();
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

  Controller.defaults = {
    ctx: null,
    numSalesmen: 30,
    numPoints: 10,
    width: 1,
    height: 1,
    numTicks: 2000
  };
  return Controller;
})();