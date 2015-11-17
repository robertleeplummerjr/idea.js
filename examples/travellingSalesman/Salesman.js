var Salesman = (function() {
  function Salesman(route) {
    var self = this;
    this.originalRoute = route;
    this.originalRouteDistances = route.flatten();
    this.route = route.clone();
    this.previousDistance = 999999999999999;
    this.experimentalRoute = null;
    this.previousFoundPoints = 0;
    this.currentFoundPoints = 0;
    this.combinations = [];
    this.previousCombinationsCount = 0;
    this.brain = new idea.NeuralNet({
      inputCount: this.originalRouteDistances.length,
      outputCount: route.points.length,
      bias: -1,
      hiddenLayerCount: 3,
      hiddenLayerNeuronCount: route.points.length / 2,
      activationResponse: 1,
      maxPerturbation: 1,
      sense: function() {
        return self.originalRouteDistances;
      },
      action: function(newIndexes) {
        var i = 0,
            newIndex,
            newRoutePoints = [],
            point,
            route = self.originalRoute,
            count = route.points.length,
            combination;

        for(; i < count; i++) {
          point = route.points[i];
          newIndex = Math.floor(newIndexes[i] * count);
          //we have already found this point
          while (newRoutePoints[newIndex]) {
            newIndex++;
          }
          newRoutePoints[newIndex] = point;
        }

        combination = newRoutePoints.join(',');
        if (self.combinations.indexOf(combination) < 0) {
          self.combinations.push(combination);
        }

        self.experimentalRoute = (new Route(newRoutePoints)).clean();
      },
      goal: function() {
        var experimentalRoute = self.experimentalRoute,
            d = experimentalRoute.distance(),
            reward = 0;

        if (d < self.previousDistance) {
          self.previousDistance = d;
          self.route = experimentalRoute;
          reward+=1000;
        }

        /*if (self.combinations.length > self.previousCombinationsCount) {
          self.previousCombinationsCount = self.combinations.length;
          reward+=0.1;
        }*/

        return reward;
      }
    });
  }

  return Salesman;
})();