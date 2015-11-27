var Jerry = (function() {
  function Jerry(route) {
    var self = this;
    this.originalRoute = route;
    this.route = route.shuffleClone();
    this.experimentalRoute = this.route.clone();
    this.previousDistance = 999999999999999;
    this.ant = new aco.Ant({
      sequence: this.route.points,
      goal: function() {
        var experimentalRoute = self.experimentalRoute,
          d = experimentalRoute.updateDistance().distance,
          reward = 0;

        if (d < self.previousDistance) {
          reward = self.previousDistance - d;
          self.previousDistance = d;
          self.route = experimentalRoute;
        }

        return reward;
      },
      sense: function(newSequence) {
        self.heuristic.settings.sequence = newSequence;
        self.route = new Route(newSequence);
      }
    });

    delete this.experimentalRoute.points;
    this.experimentalRoute.__defineGetter__('points', function() {
      return self.heuristic.settings.sequence;
    });
  }

  return Jerry;
})();