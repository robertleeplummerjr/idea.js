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
      initType: function() {
        return new Salesman(self.route);
      }
    });
  }

  Controller.prototype = {
    update: function() {
      var i = 0,
        salesman,
        hive = this.hive,
        settings = this.settings,
        max = settings.numSalesmen;

      if (this.ticks++ < settings.numTicks) {
        for (; i < max; i++) {
          salesman = hive.collection[i];
          salesman.think();
        }
      } else {
        this.beginNewDay();
      }

      return this;
    },

    beginNewDay: function() {
      this.hive
        .calcStats()
        .learn()
        .resetStats();

      console.log('Best elite distance:' + this.hive.elites[0].route.distance());

      this.day++;
      this.ticks = 0;

      return this;
    }
  };

  Controller.defaults = {
    ctx: null,
    numSalesmen: 30,
    numPoints: 100,
    width: 1,
    height: 1,
    numTicks: 10
  };
  return Controller;
})();