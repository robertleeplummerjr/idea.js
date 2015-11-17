idea.ACO = (function() {
  function ACO(settings) {
    settings = settings || {};

    var collection = [],
        defaults = ACO.defaults,
        _settings = {},
        i,
        item,
        max;

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }

    this.settings = settings = _settings;
    max = settings.count;
    i = 0;
    for (; i < max; i++) {
      item = settings.initType();
      collection.push(item);
      item.distances = [];
      item.edgePheromones = [];
    }

    for (var m = 0; m < num_cities; m++) {
      for (var n = 0; n < num_cities; n++) {
        if (m == n) {
          distances[m][n] = 0;
          edge_pheromones[m][n] = Math.MIN_VALUE;
          continue;
        }
        var city1 = cities[m];
        var city2 = cities[n];

        var xDiff = Math.abs(city1.x - city2.x);
        var yDiff = Math.abs(city1.y - city2.y);
        var diff = Math.sqrt(xDiff * xDiff + yDiff * yDiff);

        distances[m][n] = diff;
        distances[n][m] = diff;
        edge_pheromones[m][n] = INITIAL_PHEROMONE;
        edge_pheromones[n][m] = INITIAL_PHEROMONE;
      }
    }

    var num_cities = 15,
        ants_number = 30,
        main_canvas = null,
        main_context = null,

        fitness_canvas = null,
        fitness_context = null,

        width = null,
        height = null,
        fitness_width = null,
        fitness_height = null,

        cities = [],
        distances = [],
        edge_pheromones = [],
        ants = [],
        ALPHA = 0.1,// The importance of the previous trails
        BETA = 3,// The importance of the durations
        RHO = 0.1,// The decay rate of the pheromone trails
        Q = 1,
        INITIAL_PHEROMONE = 0.04,
        BEST_PATHS = [50],
        BEST_RESULT,
        INTERVAL_ID;


//http://www.idsia.ch/~luca/acs-bio97.pdf
//http://joel.inpointform.net/software-development/traveling-salesman-ant-colony-optimization-javascript-solution/
//http://www.idsia.ch/~leo/papers/acoPTSP.pdf
//http://en.wikipedia.org/wiki/2-opt


    function randomCity() {
      return {
        x: Math.random() * width,
        y: Math.random() * height
      }
    }

    function initWave() {
      ants = [];
      for (var a = 0; a < ants_number; a++) {
        ants.push({
          visited: [],
          current: undefined,
          path: []
        });
      }
    }

    function findPath(i) {
      var ant = ants[i];
      var startCity = getRandomCity();
      ant.visited.push(startCity);
      ant.current = startCity;

      while (ant.visited.length < cities.length) { //construct path
        var nextCity = getNextCity(ant);
        updateNodePheromone(nextCity);
        ant.visited.push(nextCity.to);
        ant.path.push(nextCity);
        ant.current = nextCity.to;
      }
    }
    function updateNodePheromone(nextCity){
      var updateNumber = ((Q-RHO) * edge_pheromones[nextCity.from][nextCity.to]) + (Q / distances[nextCity.from][nextCity.to]);
      edge_pheromones[nextCity.from][nextCity.to] = updateNumber;
      edge_pheromones[nextCity.to][nextCity.from] = updateNumber;
    }

    function mainAlgorithm() {
      initWave();
      for (var i = 0; i < ants_number; i++) {
        findPath(i);
      }
      TwoOptAlgorithm();
      BEST_RESULT = ants.getAntWithBestPath();

      updateGlobalPheromone(BEST_RESULT);
      updateBestPath(BEST_RESULT);

      draw();
    }

    function TwoOptAlgorithm() {
      for (var i = 0; i < ants.length; i++) {
        var currentAnt = ants[i];
        currentAnt = TwoOptBestPath(currentAnt);
        ants[i] = currentAnt;
      }
    }

    function TwoOptBestPath(ant) {
      var bestDistance = ant.path.calculatePathDistance();
      for (var i = 1; i < ant.visited.length - 1; i++) {
        for (var k = i + 1; k < ant.visited.length; k++) {
          var updatedAnt = createNewPath(ant, i, k);
          var new_distance = updatedAnt.path.calculatePathDistance();
          if (new_distance < bestDistance) {
            return TwoOptBestPath(updatedAnt);
          }
        }
      }
      return ant;
    }

    function createNewPath(existing,i,k){
      var newVisitedOrder = [];
      for (var m = 0; m < i; m++) {
        newVisitedOrder.push(existing.visited[m]);
      }

      for(var j= k;j >= i;j--){
        newVisitedOrder.push(existing.visited[j]);
      }

      for (var n = k+1; n < existing.visited.length; n++) {
        newVisitedOrder.push(existing.visited[n]);
      }

      var path = createPath(newVisitedOrder);

      return {
        visited: newVisitedOrder,
        current: existing.current,
        path: path
      }
    }

    function createPath(newOrder){
      var path = [];
      for(var i=0; i < newOrder.length-1;i++){
        path.push({
          from: newOrder[i],
          to: newOrder[i+1],
          probability: undefined
        });
      }
      return path;
    }

    function updateGlobalPheromone(result) {
      var antPath = result.ant.path;
      for (var i = 0; i < antPath.length; i++) {
        var obj = antPath[i];
//        var pheromoneUpdate = (Q / result.distance * 100) + edge_pheromones[obj.from][obj.to];
        var pheromoneUpdate = edge_pheromones[obj.from][obj.to] + (Q / result.distance * 300);
        edge_pheromones[obj.from][obj.to] = pheromoneUpdate;
        edge_pheromones[obj.to][obj.from] = pheromoneUpdate;
      }
    }

    function updateBestPath(result) {
      if (BEST_PATHS.length == 50) {
        BEST_PATHS.splice(0,1);
      }
      BEST_PATHS.push(result.distance);
    }

    function getRandomCity() {
      return Math.floor(Math.random() * num_cities);
//    return 2;
    }

    function getNextCity(ant) {
      var unvisited = [];
      var sum = 0;
      for (var i = 0; i < num_cities; i++) {
        if (!ant.visited.contains(i)) {
          var currentPheromone = edge_pheromones[ant.current][i];
          var T = Q / distances[ant.current][i];
          sum += Math.pow(T, ALPHA) * Math.pow(currentPheromone, BETA);
          unvisited.push({
            from: ant.current,
            to: i,
            probability: undefined
          });
        }
      }
      for (var a = 0; a < unvisited.length; a++) {
        calculateProbabilities(unvisited[a], sum);
      }

      return unvisited.sort(sortProbabilities)[0];
    }

    function calculateProbabilities(ant, sum) {
      var currentPheromone = edge_pheromones[ant.from][ant.to];
      var T = 1 / distances[ant.from][ant.to];
      ant.probability = (Math.pow(T, ALPHA) * Math.pow(currentPheromone, BETA)) / sum;
    }

    function sortProbabilities(a, b) {
      return a.probability < b.probability;
    }

    function draw() {
      clearMain();

      drawEdges();
      drawCities();
//    drawFitness();
      drawWaveFitness();

      requestAnimationFrame(draw);
    }

    $(document).ready(function () {
      main_canvas = $('#main_canvas');
      fitness_canvas = $('#fitness_canvas');

      main_context = main_canvas.get()[0].getContext('2d');
      fitness_context = fitness_canvas.get()[0].getContext('2d');

      width = main_canvas.width();
      height = main_canvas.height();
      fitness_width = fitness_canvas.width();
      fitness_height = fitness_canvas.height();

      main_context.fillStyle = "rgb(100, 200, 250)";
      main_context.lineWidth = 3;

      fitness_context.fillStyle = "rgb(100, 200, 250)";
      fitness_context.strokeStyle = "rgb(250, 50, 50)";

      initialize();

      INTERVAL_ID = window.setInterval(mainAlgorithm, 1000);
//    INTERVAL_ID = window.setInterval(mainAlgorithm, 500);
      draw();
    });
    Array.prototype.contains = function (elem) {
      for (var i = 0; i < this.length; i++) {
        if (this[i] === elem) return true;
      }
      return false;
    }

    Array.prototype.getAntWithBestPath = function () {
      var ants = this;
      var bestDistance = Math.MAX_VALUE;
      var bestAnt = ants[0];
      for (var i = 0; i < ants.length; i++) {
        {
          var local_best = ants[i].path.calculatePathDistance();
          if (!bestDistance || bestDistance > local_best) {
            bestDistance = local_best;
            bestAnt = ants[i];
          }
        }

      }
      return {distance: bestDistance, ant: bestAnt};
    }

    Array.prototype.calculatePathDistance = function () {
      var distance = 0;
      for (var i = 0; i < this.length; i++) {
        var obj = this[i];
        distance += distances[obj.from][obj.to];
      }
      return distance;
    }

    Array.prototype.countSame = function (distance) {
      var count = 0;
      for (var i = 0; i < this.length; i++) {
        if(this[i] == distance){
          count++;
        }
      }
      return count;
    }
  }

  ACO.prototype = {
    random: function() {
      return Math.floor(Math.random() * this.settings.count);
    }
  };

  ACO.defaults = {
    initType: function() {
      return null;
    },
    count: 5
  };

  return ACO;
})();