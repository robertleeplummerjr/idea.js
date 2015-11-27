idea.ACO = (function() {
  //http://bl.ocks.org/dustinlarimer/6d58d11e127b9c9c5f21
  function ACO(settings) {
    settings = settings || {};

    var i,
      defaults = ACO.defaults,
      _settings = {};

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }

    this.settings = _settings;
    this.routes = null;
    this.distance = null;
    this.distances = [];
    this.sum = null;
    this.avg = null;
    this.collection = [];
    this
      .calibrate()
      .initRoutes()
      .sendWave();

    for (i = 0; i < _settings.inputs.length; i++) {
      this.collection.push(_settings.initType());
    }
  }

  ACO.defaults = {
    waves: 20,
    count: 20,
    inputs: [],
    initType: null,
    calibrate: function() {

    },
    rhq: 0.1,   // Decay rate of the pheromone trails
    beta: 3,    // Importance of the durations
    alpha: 0.1, // Importance of the previous trails
    q: 1.0      // see wikipedia - updating pheromones
  };

  ACO.prototype = {
    initRoutes: function() {
      var routes = this.routes = [],
        settings = this.settings,
        inputs = settings.inputs,
        max = inputs.length,
        q = settings.q,
        route;

      /*
       Get the average distance between points - http://www.ugosweb.com/Download/JavaACSFramework.pdf

       Note that for each point, the distance to itself is 0.  This means that
       the total number of valid distances is numPoints*(numPoints-1) since the distance
       to itself is not valid
       */
      var dsum = 0,
        i = 0;
      for (; i < max; i++) {
        dsum += this.nodes[i].avg;
      }

      //each point has n-1 edges
      var totalEdges = (20 * (20 - 1)),
        avgDistance = dsum / totalEdges,
        initialPheromoneValue = q / avgDistance;

      for (i = 0; i < 20; ++i) {
        route = routes[i] = new idea.Route();

        for (var j = 0; j < 20; ++j) {
          route.pheromones[j] = new idea.Pheromone(initialPheromoneValue);
        }
      }

      this.routes = routes;

      return this;
    },
    sendWave: function() {
      var settings = this.settings,
        routes = this.routes,
        routesMax = routes.length,
        pheromonesMax,
        count = settings.count,
        rhq = settings.rhq,
        startPoint = null,//parseInt(Math.random()*this.settings.inputs.length);
        distances = [],
        changed = false,
        pheromone,
        route;

      for (var ant = 0; ant < count; ++ant) {
        var result = this.findRoute(startPoint);
        routes[ant] = result.route;
        distances[ant] = result.distance;

        if (this.route.length === 0 || result.distance < this.distance){
          this.distance = result.distance;
          this.route = result.route;
          changed = true;
        }
      }

      //update the smell globally
      for (var i = 0; i < routesMax; ++i) {
        route = routes[i];
        pheromonesMax = route.pheromones.length;
        for (var j = 0; j < pheromonesMax; ++j) {
          pheromone = route.pheromones[j];

          //decay old pheromone
          pheromone.value = pheromone.value * (1 - rhq)
            //add new pheromone
            + pheromone.update;

          pheromone.update = 0;
        }
      }

      this.distances = distances;
      this.routes = routes;
      return changed;
    },

    findRoute: function(startPoint){
      var routes = this.routes,
        currentRoute = [],
        probability = [],
        visited = [],
        settings = this.settings,
        q = settings.q;


      if (startPoint == null){
        //start at a random location
        startPoint = parseInt(Math.random() * routes.length);
      }

      var curr = startPoint;
      currentRoute[0] = curr;

      //get route for the ant
      //any has to visit each point so run this numPoints times
      //minus one since we visit the first node already
      for (var step = 1; step < this.nodes.length; step++){
        visited[curr] = 1;

        //probability for next visit
        var probSum = 0.0;
        for (var next = 0; next < this.nodes.length; next++){
          if (visited[next] != 1){
            //probability[next] = distanceAB^-beta * pheromoneAB^alpha
            //see reference formula
            probability[next] =
              Math.pow(routes[curr].pheromones[next], settings.alpha)
              * Math.pow(this.nodes[curr].distances[next], 0 - settings.beta);
            probSum += probability[next];
          }
          else {
            probability[next] = 0;
          }
        }

        //One method is to convert the probability array to actual probabilities by
        //dividing by probSum.  Then create a random value between 0 and 1 and add up probabilities
        //for each route to the next point until one finally surpasses the random value.
        //This point would be chosen for the next route.  Google does the same thing but
        //Just takes a percentage of probSum rather than convert everything to probabilities
        //between 0 and 1
        var nextCity = -1,
          nextThresh = Math.random() * probSum,
          i = 0;
        for (;i < this.nodes.length; i++){
          nextThresh -= probability[i];
          if (nextThresh<=0) {
            nextCity = i;
            break;
          }
        }

        currentRoute[step] = nextCity;
        curr = nextCity;
      }


      /* do k2 optimization
       var opt2 = new Tsp.Sequential2OptRunner({startRoute:currentRoute, distances:_distances, isKnownStart:false});
       while(opt2.runOnce()){}
       currentRoute = opt2.route;*/

      var currentDistance = (function(route, from, to) {
        var cost = 0;
        for (var i=from+1;i<=to;i++) {
          cost += this.nodes[route[i-1]].distances[route[i]];
        }
        return cost;
      })(currentRoute, 0, currentRoute.length - 1);

      //store pheromones so that they can be added to the previous
      //values after all the ants have finished
      for (var i = 0; i < this.nodes.length-1; i++) {
        routes[currentRoute[i]].pheromones[currentRoute[i + 1]].update += q / currentDistance;
      }

      return {distance:currentDistance, route:currentRoute};
    }
  };

  return ACO;
})();