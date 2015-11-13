var Salesman = (function() {
  function Salesman(route) {
    var self = this;
    this.originalRoute = route;
    this.route = route.clone();
    this.previousDistance = 999999999999999;
    this.experimentalRoute = null;
    this.brain = new idea.NeuralNet({
      inputCount: route.points.length - 1,
      outputCount: route.points.length,
      bias: -1,
      hiddenLayerCount: 1,
      hiddenLayerNeuronCount: 6,
      activationResponse: 1,
      maxPerturbation: 0.3,
      sense: function() {
        return self.route.distances();
      },
      goal: function() {
        var experimentalRoute = self.experimentalRoute,
          d = experimentalRoute.distance();
        if (d < self.previousDistance) {
          self.previousDistance = d;
          self.route = experimentalRoute;
          return 1;
        }
        return 0;
      },
      action: function(newIndexes) {
        var i = 0,
          newIndex,
          newRoutePoints = [],
          point,
          count = self.originalRoute.points.length,
          route = self.originalRoute;

        for(; i < count; i++) {
          point = route.points[i];
          newIndex = Math.floor(newIndexes[i] * count);
          while (newRoutePoints[newIndex]) {
            newIndex++;
            if (isNaN(newIndex)) {
              throw new Error('Something blew up');
              break;
            }
          }
          newRoutePoints[newIndex] = point;
        }

        self.experimentalRoute = (new Route(newRoutePoints))
          .clean();
      }
    });
  }

  Salesman.prototype = {
    think: function() {
      this.brain.think();
      return this;
    }
  };

  return Salesman;
})();