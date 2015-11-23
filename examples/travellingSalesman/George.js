var George = (function() {
  function George(route) {
    var self = this;
    this.originalRoute = route;
    this.originalRouteFlattened = route.flatten();
    this.route = route.clone();
    this.previousDistance = 999999999999999;
    this.experimentalRoute = null;
    this.previousIntersects = 99999999999999999;
    this.brain = new idea.NeuralNet({
      inputCount: this.originalRouteFlattened.length,
      outputCount: route.points.length,
      bias: -1,
      hiddenLayerCount: 1,
      hiddenLayerNeuronCount: this.originalRouteFlattened.length * 2,
      activationResponse: 1,
      maxPerturbation:.1,
      sense: function() {
        return (self.experimentalRoute || self.route).flatten();
      },
      action: function(newIndexes) {
        var i = 0,
            newIndex,
            newRoutePoints = [],
            point,
            route = self.originalRoute,
            count = route.points.length;

        for(; i < count; i++) {
          point = route.points[i];
          newIndex = Math.floor(newIndexes[i] * count);
          //we have already found this point
          while (newRoutePoints[newIndex]) {
            newIndex++;
          }
          newRoutePoints[newIndex] = point;
        }

        self.experimentalRoute = (new Route(newRoutePoints)).clean();
      },
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

  return George;
})();