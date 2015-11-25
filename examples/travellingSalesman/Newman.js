var Newman = (function() {
  function Newman(route) {
    var self = this;
    this.originalRoute = route;
    this.route = route.clone();
    this.previousDistance = 999999999999999;
    this.previousIntersects = 99999999999999999;
    this.heuristic = new idea.Heuristic({
      sequence: this.route.points,
      goal: function() {
        self.route.points = self.heuristic.settings.sequence;

        var experimentalRoute = self.route,
          d = experimentalRoute.updateDistance().distance;

        if (d < self.previousDistance) {
          self.previousDistance = d;
          self.route = experimentalRoute;
          return self.previousDistance - d;
        }

        return 0;
      }
    });
  }

  return Newman;
})();