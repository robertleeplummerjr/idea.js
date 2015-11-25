var Newman = (function() {
  function Newman(route) {
    var self = this;
    this.originalRoute = route;
    this.route = route.shuffleClone();
    this.experimentalRoute = this.route.clone();
    this.previousDistance = 999999999999999;
    this.heuristic = new idea.Heuristic({
      sequence: this.route.points,
      goal: function() {
        var experimentalRoute = self.experimentalRoute,
          d = experimentalRoute.updateDistance().distance,
          reward = 0;

        if (d < self.previousDistance) {
          self.previousDistance = d;
          self.route = experimentalRoute;
          reward = 1;
        }

        return reward;
      }
    });

    delete this.experimentalRoute.points;
    this.experimentalRoute.__defineGetter__('points', function() {
      return self.heuristic.settings.sequence;
    });
  }

  return Newman;
})();