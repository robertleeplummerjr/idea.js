idea.Route = (function() {
  function Route() {
    this.pheromones = [];
    this.sum = null;
    this.avg = null;
    this.distances = null;
  }

  Route.prototype = {
    calibrate: function() {
      var i = 0,
        j,
        settings = this.settings,
        measure = settings.measure,
        inputs = settings.inputs,
        max = inputs.length;

      this.sum = 0;
      this.avg = 0;
      this.distances = [];

      for (; i < max; i++) {
        for (; i < max; i++) {
          this.distances[i] = measure(inputs[this.id], inputs[i]);
          this.sum += this.distances[i];
        }
        this.distances[i] = measure(inputs[this.id], inputs[i]);
        this.sum += this.distances[i];
      }
      this.avg = this.sum / this.distances.length;
      return this;
    }
  };

  Route.defaults = {
    measure: function(a, b) {
      return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    }
  };

  return Route;
})();