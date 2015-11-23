idea.ACO = (function() {
  //http://bl.ocks.org/dustinlarimer/6d58d11e127b9c9c5f21
  function ACO(settings) {

  }

  ACO.defaults = {

  };

  var points = 20
    , waves = 40
    , nodes = []
    , stage = {
      height: context.innerHeight
      , width: context.innerWidth
    };

  var wave = function(nodes){
    var self = extend(this, { nodes: nodes });

    var NUM_ANTS = 20
      , RHO = 0.1      // Decay rate of the pheromone trails
      , BETA = 3.0     // Importance of the durations
      , ALPHA = 0.1    // Importance of the previous trails
      , Q = 1.0;       // see wikipedia - updating pheromones

    var result = initPheromones();
    var _pher = result.pheromones;
    var _nextPher = result.pherUpdates;

    self.route = [];
    self.distance;
    self.routes;
    self.distances;

    self.runOnce = function(){
      var result = sendWave(NUM_ANTS,_pher,_nextPher);
      self.routes = result.paths;
      self.distances = result.distances;
    };

    function initPheromones(){
      //init pheremons
      var pheromones = new Array(self.nodes.length);
      var pherUpdates = new Array(self.nodes.length);

      /*
       Get the average distance between points - http://www.ugosweb.com/Download/JavaACSFramework.pdf

       Note that for each point, the distance to itself is 0.  This means that
       the total number of valid distances is numPoints*(numPoints-1) since the distance
       to itself is not valid
       */
      var dsum = 0;
      for (var i = 0; i < self.nodes.length; i++) {
        dsum += self.nodes[i].avg;
      }
      //each point has n-1 edges
      var totalEdges = (20*(20-1));
      var avgDistance = dsum / totalEdges;
      var initVal = Q / avgDistance;

      for (var i = 0; i < 20; ++i) {
        pheromones[i] = new Array(20);
        pherUpdates[i] = new Array(20);

        for (var j = 0; j < 20; ++j) {
          pheromones[i][j] = initVal;
          pherUpdates[i][j] = 0.0;
        }
      }

      return { pheromones:pheromones, pherUpdates:pherUpdates };
    }

    function sendWave(numAnts, pheromones, pherUpdates){
      var startPoint = null; //parseInt(Math.random()*self.nodes.length);

      var paths = new Array(numAnts);
      var distances = new Array(numAnts);

      var changed = false;
      for (var ant = 0; ant < numAnts; ++ant)
      {
        var result = findAntPath(pheromones, pherUpdates, startPoint);
        paths[ant] = result.path;
        distances[ant] = result.distance;

        if(self.route.length ==0 || result.distance<self.distance){
          self.distance = result.distance;
          self.route = result.path;
          changed = true;
        }
      }

      //update the smell globally
      for (var i = 0; i < self.nodes.length; ++i)
      {
        for (var j = 0; j < self.nodes.length; ++j)
        {
          pheromones[i][j] =
            //decay old pheromone
            pheromones[i][j] * (1.0 - RHO)
              //add new pheromone
            + pherUpdates[i][j];

          pherUpdates[i][j] = 0.0;
        }
      }

      return {paths:paths, distances:distances, changed:changed};
    }

    function findAntPath(pheromones, pherUpdates, startPoint){

      var currPath = new Array(self.nodes.length);
      var probability = new Array(self.nodes.length);
      var visited = new Array(self.nodes.length);


      if(startPoint == null){
        //start at a random location
        startPoint = parseInt(Math.random()*self.nodes.length);
      }

      var curr = startPoint;
      currPath[0] = curr;

      //get path for the ant
      //any has to visit each point so run this numPoints times
      //minus one since we visit the first node already
      for (var step = 1; step < self.nodes.length; step++){
        visited[curr] = 1;

        //probability for next visit
        var probSum = 0.0;
        for (var next = 0; next < self.nodes.length; next++){
          if (visited[next] != 1){
            //probability[next] = distanceAB^-beta * pheromoneAB^alpha
            //see reference formula
            probability[next] = Math.pow(pheromones[curr][next], ALPHA) * Math.pow(self.nodes[curr].distances[next], 0.0-BETA);
            probSum += probability[next];
          }
          else {
            probability[next] = 0;
          }
        }

        //One method is to convert the probability array to actual probabilities by
        //dividing by probSum.  Then create a random value between 0 and 1 and add up probabilities
        //for each path to the next point until one finally surpasses the random value.
        //This point would be chosen for the next path.  Google does the same thing but
        //Just takes a percentage of probSum rather than convert everything to probabilities
        //between 0 and 1
        var nextCity = -1;
        var nextThresh = Math.random()*probSum;
        for(var i=0;i<self.nodes.length;i++){
          nextThresh -= probability[i];
          if (nextThresh<=0) {
            nextCity = i;
            break;
          }
        }

        currPath[step] = nextCity;
        curr = nextCity;
      }


      /* do k2 optimization
       var opt2 = new Tsp.Sequential2OptRunner({startRoute:currPath, distances:_distances, isKnownStart:false});
       while(opt2.runOnce()){}
       currPath = opt2.route;*/

      var currDist = function(route, from, to){
        var cost = 0;
        for(var i=from+1;i<=to;i++){
          cost += self.nodes[route[i-1]].distances[route[i]];
        }
        return cost;
      }(currPath, 0, currPath.length-1);

      //store pheromons so that they can be added to the previous
      //values after all the ants have finished
      for (var i = 0; i < self.nodes.length-1; i++)
      {
        pherUpdates[currPath[i]][currPath[i+1]] += Q/currDist;
      }

      return {distance:currDist, path:currPath};
    }

    return self;
  };

  var node = function(config){
    extend(this, config);
    return this;
  };

  ACO.prototype = {
    calibrate: function(){
      this.sum = 0;
      this.avg = 0;
      for (var i = 0; i < nodes.length; i++){
        this.distances[i] = distance(nodes[this.id], nodes[i]);
        this.sum += this.distances[i];
      }
      this.avg = this.sum / this.distances.length;
      return this;
    }
  };

  function distance(a, b){
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }

  function extend(target){
    for (var i = 1; i < arguments.length; i++) {
      for (var prop in arguments[i]){
        target[prop] = arguments[i][prop];
      }
    }
    return target;
  }



  // Generate random points
  for (var i = 0; i < points; i++){
    nodes.push(new node({
      id: i
      , x: Math.floor(Math.random() * (stage.width - 50)) + 25
      , y: Math.floor(Math.random() * (stage.height - 50)) + 25
      , distances: new Array(points)
      , sum: 0
      , avg: 0
    }));
  }

  // Compose the landscape
  var svg = d3.select("#map").append("svg");

  var draggable = d3.behavior.drag()
    .on("dragstart", function(d){
      for (var i = 0; i < edges.length; i++){
        if (edges[i]['source'] == d.id || edges[i]['target'] == d.id) {
          paths.attr("stroke-opacity", 0);
          //paths[0][i].remove();
        }
      }
    })
    .on("drag", function(d, i){
      d.x = d3.event.x;
      d.y = d3.event.y;
      d3.select(this)
        .attr("transform", function(d,i){
          return "translate(" + d.x + ", " + d.y + ")";
        })
    })
    .on("dragend", function(){
      run();
    });

  var dots = svg.append("svg:g")
    .attr("class", "nodes")
    .selectAll("g.point")
    .data(nodes);

  dots
    .enter()
    .append("svg:g")
    .attr("class", "point")
    .attr("transform", function(d,i){ return "translate(" + d.x + ", " + d.y + ")"; })
    .call(draggable)
    .append("svg:circle")
    .attr("r", 10)
    .attr("stroke", "#fff")
    .attr("stroke-width", 3);

  var paths = svg.selectAll("line.path");
  var edges = [];

  function run(){
    // Calculate distance between all points
    for (var i = 0; i < nodes.length; i++){
      nodes[i].calibrate();
      waves = 40;
    }

    var runner = new wave(nodes);
    var aco_timer = setInterval(function(){
      var result;
      waves--;
      result = runner.runOnce();
      if (!waves || waves < 0){
        waves = 40;
        clearInterval(aco_timer);
      }

      edges = [];
      for (var i = 0; i < runner.route.length-1; i++){
        edges.push({
          source: nodes[runner.route[i]]['id']
          , target: nodes[runner.route[i+1]]['id']
          , x1: nodes[runner.route[i]]['x']
          , y1: nodes[runner.route[i]]['y']
          , x2: nodes[runner.route[i+1]]['x']
          , y2: nodes[runner.route[i+1]]['y']
        });
      }

      paths = paths.data(edges);

      paths
        .enter()
        .insert("line", "g.nodes")
        .attr("class", "path")

      paths
        .attr("stroke", "#333")
        .attr("stroke-width", 10)
        .attr("stroke-opacity", .1)
        .attr("x1", function(d,i){ return d.x1 })
        .attr("y1", function(d,i){ return d.y1 })
        .attr("x2", function(d,i){ return d.x2 })
        .attr("y2", function(d,i){ return d.y2 });

      paths
        .exit()
        .transition()
        .remove();

    }, 50);
  };
  run();

  return ACO;
})();