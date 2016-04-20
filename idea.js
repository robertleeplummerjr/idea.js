'use strict';

var idea = (function() {
  function Colony(settings) {
  settings = settings || {};
  this.graph = new Graph();
  this.collection = [];

  var _settings = {},
    defaults = Colony.defaults,
    i;

  for (i in defaults) if (defaults.hasOwnProperty(i)) {
    _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
  }

  this.settings = _settings;
  this.iteration = 0;
  this.minPheromone = null;
  this.maxPheromone = null;
  this.iterationBest = null;
  this.globalBest = null;

  this.fill();
}

Colony.acsStrategy = 0;
Colony.maxminStrategy = 1;
Colony.elitistStrategy = 2;

Colony.defaults = {
  count: 20,
  alpha: 1,
  beta: 3,
  rho: 0.1,
  q: 1,
  initPheromone: 1,
  strategy: Colony.acsStrategy,
  elitistWeight: 0,
  maxIterations: 250,
  minScalingFactor: 0.001,
  Type: Ant
};

Colony.prototype = {
  size: function() { return this.collection.length; },
  fill: function() {
    var i = 0,
      settings = this.settings,
      max = settings.count;

    this.collection = [];
    this.iterationBest = null;
    for (; i < max; i++) {
      this.collection.push(new settings.Type(this.graph, {
        alpha: settings.alpha,
        beta: settings.beta,
        q: settings.q
      }));
    }
    return this;
  },

  reset: function() {
    this.iteration = 0;
    this.globalBest = null;
    this.fill();
    this.iterationBest = null;
    this.graph.resetPheromone();
    return this;
  },

  setInitialPheromone: function () {
    var edges = this.graph.edges,
      settings = this.settings,
      initPheromone = settings.initPheromone,
      i;
    for (i in edges) if (edges.hasOwnProperty(i)) {
      edges[i].initPheromone = initPheromone;
    }
    return this;
  },

  ready: function() {
    return this.graph.size() > 1;
  },

  live: function() {
    if (!this.ready()) {
      return this;
    }

    this.iteration = 0;
    while (this.iteration < this.settings.maxIterations) {
      this.step();
    }

    return this;
  },

  step: function() {
    if (!this.ready()) return this;

    this.fill();

    var i = 0,
      collection = this.collection,
      max = collection.length;

    for (; i < max; i++) {
      collection[i].live();
    }

    this
      .updateGlobalBest()
      .updatePheromone();

    this.iteration++;
    return this;
  },

  updatePheromone: function() {
    var edges = this.graph.edges,
      edge,
      settings = this.settings,
      rho = settings.rho,
      q = settings.q,
      strategy = settings.strategy,
      maxIterations = settings.maxIterations,
      minScalingFactor = settings.minScalingFactor,
      collection = this.collection,
      j = 0,
      max = collection.length,
      elitistWeight = this.elitistWeight,
      pheromone,
      best,
      i;

    for (i in edges) if (edges.hasOwnProperty(i)) {
      edge = edges[i];
      pheromone = edge.pheromone;
      edge.pheromone = pheromone * (1 - rho);
    }

    switch (strategy) {
      case Colony.maxminStrategy:
        if ((this.iteration / maxIterations) > 0.75) {
          best = this.globalBest;
        } else {
          best = this.getIterationBest();
        }

        // Set maxmin
        this.maxPheromone = q / best.tour.updateDistance();
        this.minPheromone = this.maxPheromone * minScalingFactor;

        best.addPheromone();

        for (i in edges) if (edges.hasOwnProperty(i)) {
          edge = edges[i];
          pheromone = edge.pheromone;
          if (pheromone > this.maxPheromone) {
            edge.pheromone = this.maxPheromone;
          } else if (pheromone < this.minPheromone) {
            edge.pheromone = this.minPheromone;
          }
        }
        return this;
      case Colony.elitistStrategy:
        this.globalBest.addPheromone(elitistWeight);
      default:
        collection.forEach(function(resident) {
          resident.addPheromone();
        });
    }

    return this;
  },

  getIterationBest: function() {
    var collection = this.collection,
      max = collection.length,
      best = collection[0],
      i = 0;

    if (best.tour === null) {
      return null;
    }

    if (this.iterationBest === null) {
      this.iterationBest = best;
      for (; i < max; i++) {
        if (best.tour.updateDistance() >= collection[i].tour.updateDistance()) {
          this.iterationBest = collection[i];
        }
      }
    }

    return this.iterationBest;
  },

  updateGlobalBest: function() {
    var best = this.getIterationBest();

    if (best === null && this.globalBest === null) return this;
    if (best === null) return this;

    if (this.globalBest === null || best.tour.updateDistance() < this.globalBest.tour.distance) {
      this.globalBest = best;
    }

    return this;
  }
};function Ant(graph, settings) {
  this.graph = graph;

  this.alpha = settings.alpha;
  this.beta = settings.beta;
  this.q = settings.q;
  this.tour = null;
  this.index = Math.random() * 1000;
}

Ant.prototype = {
  reset: function() {
    this.tour = null;
    return this;
  },

  init: function() {
    this.tour = new Tour(this.graph);
    var randPointIndex = Math.floor(Math.random() * this.graph.size());
    this.currentPoint = this.graph.points[randPointIndex];
    this.tour.addPoint(this.currentPoint);
    return this;
  },

  makeNextMove: function() {
    if (this.tour === null) {
      this.init();
    }

    var rouletteWheel = 0,
      points = this.graph.points,
      alpha = this.alpha,
      beta = this.beta,
      tour = this.tour,
      graph = this.graph,
      finalPheromoneWeight,
      edge,
      i,
      max = points.length,
      pointProbabilities = [],
      wheelTarget,
      wheelPosition = 0.0;

    for (i = 0; i < max; i++) {
      if (!tour.contains(points[i])) {
        edge = graph.getEdge(this.currentPoint, points[i]);
        if (alpha === 1) {
          finalPheromoneWeight = edge.pheromone;
        } else {
          finalPheromoneWeight = Math.pow(edge.pheromone, alpha);
        }
        pointProbabilities[i] = finalPheromoneWeight * Math.pow(1.0 / edge.distance, beta);
        rouletteWheel += pointProbabilities[i];
      }
    }

    wheelTarget = rouletteWheel * Math.random();

    for (i = 0; i < max; i++) {
      if (!tour.contains(points[i])) {
        wheelPosition += pointProbabilities[i];
        if (wheelPosition >= wheelTarget) {
          this.currentPoint = points[i];
          tour.addPoint(points[i]);
          tour.updateDistance();
          return this;
        }
      }
    }

    return this;
  },

  tourFound: function() {
    if (this.tour === null) {
      return false;
    }
    return (this.tour.size() >= this.graph.size());
  },

  live: function() {
    this.reset();
    while (!this.tourFound()) {
      this.makeNextMove();
    }
    return this;
  },

  addPheromone: function(weight) {
    if (weight === undefined) {
      weight = 1;
    }

    var tour = this.tour,
      graph = this.graph,
      max = tour.size() - 1,
      extraPheromone = (this.q * weight) / tour.distance,
      i = 0,
      fromPoint,
      toPoint,
      edge,
      pheromone;

    for (; i < max; i++) {
      fromPoint = tour.points[i];
      toPoint = tour.points[i + 1];
      edge = graph.getEdge(fromPoint, toPoint);
      pheromone = edge.pheromone;
      edge.pheromone = pheromone + extraPheromone;
    }

    //last
    fromPoint = tour.points[i];
    toPoint = tour.points[0];
    edge = graph.getEdge(fromPoint, toPoint);
    pheromone = edge.pheromone;
    edge.pheromone = pheromone + extraPheromone;

    return this;
  }
};
function Edge(pointA, pointB) {
  this.pointA = pointA;
  this.pointB = pointB;
  this.initPheromone = 1;
  this.pheromone = this.initPheromone;

  // Calculate edge distance
  var deltaXSq = Math.pow((pointA.x - pointB.x), 2),
    deltaYSq = Math.pow((pointA.y - pointB.y), 2);

  this.distance = Math.sqrt(deltaXSq + deltaYSq);
}

Edge.prototype = {
  contains: function(point) {
    return (this.pointA.x === point.x || this.pointB.x === point.x);//TODO: y axis?
  },

  resetPheromone: function() {
    this.pheromone = this.initPheromone;
    return this;
  }
};function Graph() {
  this.points = [];
  this.edges = {};
  this.edgeCount = 0;
}

Graph.prototype = {
  size: function() {
    return this.points.length;
  },

  addPoint: function(x, y) {
    this.points.push(new Point(x, y));
    return this;
  },

  addEdge: function(pointA, pointB) {
    var key = pointA.toString() + '-' + pointB.toString();
    this.edges[key] = new Edge(pointA, pointB);
    this.edgeCount++;
    return this;
  },

  getEdge: function(pointA, pointB) {
    var key1 = pointA.toString() + '-' + pointB.toString(),
      key2 = pointB.toString() + '-' + pointA.toString();

    if (this.edges[key1] != undefined) {
      return this.edges[key1];
    }
    if (this.edges[key2] != undefined) {
      return this.edges[key2];
    }
    return null;
  },

  createEdges: function() {
    this.edges = {};

    var i = 0,
      max = this.points.length,
      connectionI;

    for (; i < max; i++) {
      for (connectionI = i; connectionI < max; connectionI++) {
        this.addEdge(this.points[i], this.points[connectionI]);
      }
    }
    return this;
  },

  resetPheromone: function() {
    var edges = this.edges,
      i;
    for (i in edges) if (edges.hasOwnProperty(i)) {
      edges[i].resetPheromone();
    }
    return this;
  },

  clear: function() {
    this.points = [];
    this.edges = {};
    return this;
  }
};
function Point(x, y) {
  this.x = x;
  this.y = y;
}

Point.prototype = {
  toString: function() {
    return this.x + ',' + this.y;
  },
  isEqual: function(point) {
    return (this.x === point.x && this.y === point.y);
  }
};
function Tour(graph) {
  this.graph = graph;
  this.points = [];
  this.distance = null;
}

Tour.prototype = {
  size: function() {
    return this.points.length;
  },

  contains: function(point) {
    var points = this.points,
      max = points.length,
      i = 0;

    for (; i < max; i++) {
      if (point.isEqual(points[i])) {
        return true;
      }
    }

    return false;
  },

  addPoint: function(point) {
    this.distance = null;
    this.points.push(point);
    return this;
  },

  updateDistance: function() {
    var distance = 0,
      edge,
      points = this.points,
      graph = this.graph,
      max = points.length - 1,
      i = 0;

    for (; i < max; i++) {
      edge = graph.getEdge(points[i], points[i + 1]);
      distance += edge.distance;
    }

    //connect last to first
    edge = graph.getEdge(points[i], points[0]);
    distance += edge.distance;

    return this.distance = Math.round(distance);
  }
};/**
 *
 * @param {Object} settings
 * @constructor
 */
function Hive(settings) {
  var defaults = Hive.defaults,
    i,
    collection = this.collection = [],
    _settings = {};

  settings = settings || {};
  for (i in defaults) if (defaults.hasOwnProperty(i)) {
    _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
  }

  this.learnCount = 0;
  this.settings = settings = _settings;
  this.totalRewards = 0;
  this.bestRewards = 0;
  this.avgRewards = 0;
  this.lowestRewards = Hive.defaults.worstRewards;
  this.bestWisdom = null;
  this.elites = [];
  this.nonElites = [];

  for (i = 0; i < settings.count; i++) {
    collection.push(settings.initType());
  }
}

Hive.prototype = {
  /**
   *
   * @param {*} teacher
   * @param {*} student
   * @returns {Hive}
   */
  teach: function (teacher, student) {
    var i = 0,
      studentWisdom = new Wisdom([], this.settings.maxPerturbation),
      teacherWisdom = teacher.brain.wisdom,
      weights = teacher.brain.wisdom.weights,
      crossoverPoint,
      max = weights.length;

    if (Math.random() > this.settings.crossoverRate) {
      for (; i < max; i++) {
        studentWisdom.weights[i] = teacherWisdom.weights[i];
      }
    } else {
      // Pick a crossover point.
      crossoverPoint = Math.floor((Math.random() * (this.settings.weightCount - 1)));

      // Swap weights
      for (; i < crossoverPoint; i++) {
        studentWisdom.weights[i] = teacherWisdom.weights[i];
      }

      for (i = crossoverPoint; i < max; i++) {
        studentWisdom.weights[i] = teacherWisdom.weights[i];
      }
    }

    studentWisdom.hypothesize(this.settings.mutationRate);
    student.brain.wisdom = studentWisdom;
    student.brain.putWeights();

    return this;
  },

  // Maybe switch this out with Tournament selection?
  /**
   *
   * @returns {Wisdom}
   */
  select: function () {
    var slice = Math.random() * this.totalRewards,
      settings = this.settings,
      item,
      chosen = null,
      currentRewards = 0,
      max = settings.count,
      i = 0;

    // Keep adding rewards until it is above the slice,
    // then we stop and take the current wisdom
    for (; i < max; i++) {
      item = this.collection[i];
      currentRewards += item.brain.wisdom.rewards;
      if (currentRewards >= slice) {
        chosen = item;
        break;
      }
    }
    return chosen;
  },

  /**
   *
   * @param {number} [eliteCount]
   * @param {boolean} [resetRewards]
   * @returns {Hive}
   */
  setElites: function (eliteCount, resetRewards) {
    eliteCount = eliteCount || this.settings.eliteCount;
    resetRewards = resetRewards !== undefined ? resetRewards : true;

    var item,
      collection = this.collection,
      settings = this.settings,
      elites = this.elites = [],
      nonElites = this.nonElites = [],
      i = 0,
      max = settings.count,
      nonEliteCount = max - eliteCount;

    for (; i < max; i++) {
      item = collection[i];

      if (resetRewards) {
        item.brain.wisdom.rewards = 0;
      }

      if (nonElites.length < nonEliteCount) {
        nonElites.push(item);
      } else {
        elites.push(item);
      }
    }

    elites.reverse();
    nonElites.reverse();

    return this;
  },

  /**
   *
   * @returns {Hive}
   */
  calcStats: function () {
    this.sort();
    this.totalRewards = 0;
    var bestRewards = 0,
      settings = this.settings,
      rewards,
      wisdom,
      item,
      max = settings.count,
      lowestRewards = this.lowestRewards,
      i = 0;

    for (; i < max; i++) {
      item = this.collection[i];
      wisdom = item.brain.wisdom;
      rewards = wisdom.rewards;
      if (rewards > bestRewards) {
        bestRewards = rewards;
        this.bestRewards = bestRewards;
        this.bestWisdom = wisdom;
      }

      if (rewards < lowestRewards) {
        lowestRewards = rewards;
        this.lowestRewards = lowestRewards;
      }
      this.totalRewards += rewards;
    }

    this.avgRewards = this.totalRewards / this.settings.count;
    return this;
  },
  resetStats: function () {
    this.totalRewards = 0;
    this.bestRewards = 0;
    this.lowestRewards = Hive.defaults.worstRewards;
    this.avgRewards = 0;

    return this;
  },
  sort: function () {
    this.settings.sort.call(this, this.collection);
    return this;
  },
  learn: function () {
    this.learnCount++;
    this
      .calcStats()
      .setElites();

    var elites = this.elites,
      elite,
      nonElites = this.nonElites,
      nonElite,
      max = nonElites.length,
      i = 0;

    for (; i < max; i++) {
      elite = elites.length > 0 ? elites[Math.floor(Math.random() * (elites.length - 1))] : this.select();
      nonElite = nonElites[i];
      this.teach(elite, nonElite);
    }

    return this;
  },

  /**
   *
   * @param {Function} [each]
   * @returns {Hive}
   */
  live: function (each) {
    var collection = this.collection,
      max = collection.length,
      item,
      i = 0;

    if (each === undefined) {
      for (; i < max; i++) {
        item = collection[i];
        item.brain.think();
      }
    } else {
      for (; i < max; i++) {
        item = collection[i];
        item.brain.think();
        each.call(this, item, i);
      }
    }

    return this;
  }
};

Hive.defaults = {
  initType: function () {
    return null;
  },
  sort: function () {
    this.collection.sort(function (a, b) {
      if (a.brain.wisdom.rewards > b.brain.wisdom.rewards) {
        return 1;
      }

      if (a.brain.wisdom.rewards < b.brain.wisdom.rewards) {
        return -1;
      }

      return 0;
    });
  },
  worstRewards: 9999999,
  count: 30,
  mutationRate: 0.1,
  crossoverRate: 0.7,
  weightCount: 0,
  maxPerturbation: 0.3,
  eliteCount: 5,
  eliteCopiesCount: 1
};/**
 * @param {Object} settings
 * @constructor
 */
function NeuralNet(settings) {
  var defaults = NeuralNet.defaults,
    i,
    _settings = {};

  settings = settings || {};
  for (i in defaults) if (defaults.hasOwnProperty(i)) {
    _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
  }

  this.settings = _settings;
  this.layers = [];
  this.wisdom = null;

  this
    .connect()
    .createWisdom();
}

NeuralNet.prototype = {
  /**
   * this method builds the a NN. The weights are all initially set to random values between -1 and 1
   * @returns {NeuralNet}
   */
  connect: function () {
    var settings = this.settings,
      max = settings.hiddenLayerCount - 1,
      i = 0,
      layers = this.layers;

    //create the layers of the network
    if (settings.hiddenLayerCount > 0) {
      //create first hidden layer
      layers.push(new Synapses(settings.hiddenLayerNeuronCount, settings.inputCount));
      for (; i < max; i++) {
        layers.push(new Synapses(settings.hiddenLayerNeuronCount, settings.hiddenLayerNeuronCount));
      }

      //create output layer
      layers.push(new Synapses(settings.outputCount, settings.hiddenLayerNeuronCount));
    } else {
      //create output layer
      layers.push(new Synapses(settings.outputCount, settings.inputCount));
    }

    return this;
  },

  /**
   *
   * @returns {NeuralNet}
   */
  createWisdom: function () {
    var settings = this.settings,
      weights = [],
      i = 0,
      max = this.getNumWeights();

    for (; i < max; i++) {
      weights.push(Math.random() - Math.random());
    }

    this.wisdom = new Wisdom(weights, settings.maxPerturbation);
    this.putWeights(weights);

    return this;
  },

  reward: function () {
    this.wisdom.reward();
    return this;
  },

  /**
   * returns weights
   * @returns {number[]}
   */
  getWeights: function () {
    var settings = this.settings,
      weights = [],
      layer,
      neuron,
      i,
      j,
      k;

    //for each layer
    for (i = 0; i <= settings.hiddenLayerCount; i++) {
      layer = this.layers[i];

      //for each neuron
      for (j = 0; j < layer.neurons.length; j++) {
        neuron = layer.neurons[j];

        //for each weight
        for (k = 0; k < neuron.weights.length; k++) {
          weights.push(neuron.weights[k]);
        }
      }
    }
    return weights;
  },

  /**
   * replaces the weights in the NN with the new values
   * @param {number[]} [weights]
   * @returns {NeuralNet}
   */
  putWeights: function (weights) {
    weights = weights || this.wisdom.weights;

    var settings = this.settings,
      cWeight = 0,
      layer,
      neuron,
      i,
      j,
      k;

    //for each layer
    for (i = 0; i <= settings.hiddenLayerCount; i++) {
      layer = this.layers[i];

      //for each neuron
      for (j = 0; j < layer.neurons.length; j++) {
        neuron = layer.neurons[j];

        //for each weight
        for (k = 0; k < neuron.weights.length; k++) {
          neuron.weights[k] = weights[cWeight++];
        }
      }
    }

    return this;
  },

  /**
   * returns the total number of weights needed for the net
   * @returns {number}
   */
  getNumWeights: function () {
    var weights = 0,
      layer,
      neuron,
      i,
      j,
      k;

    //for each layer
    for (i = 0; i < this.layers.length; i++) {
      layer = this.layers[i];

      //for each neuron
      for (j = 0; j < layer.neurons.length; j++) {
        neuron = layer.neurons[j];

        //for each weight
        for (k = 0; k < neuron.weights.length; k++) {
          weights++;
        }
      }
    }

    return weights;
  },

  /**
   * causes a chain reaction of analysis (neural net processing) of senses (inputs), which causes an action (outputs) and potentially a reward
   * @returns {NeuralNet}
   */
  think: function () {
    var settings = this.settings,
      inputs = settings.sense !== null ? settings.sense() : [],
      outputs = [],
      layer,
      neurons,
      neuron,
      weight = 0,
      netInput,
      inputCount,
      i,
      j,
      k;

    //first check that we have the correct amount of inputs
    if (inputs.length != settings.inputCount) {
      return this;
    }

    //For each layer....
    for (i = 0; i <= settings.hiddenLayerCount; i++) {
      layer = this.layers[i];
      neurons = layer.neurons;
      //After the first layer, the inputs get set to the output of previous layer
      if (i > 0) {
        //we clone the output so it isn't cleared after this step
        inputs = outputs.slice(0);
      }

      while (outputs.length > 0) {
        outputs.pop()
      }

      weight = 0;

      /*
       for each neuron sum the (inputs * corresponding weights).Throw
       the total at our sigmoid function to get the output
       */
      for (j = 0; j < neurons.length; j++) {
        neuron = neurons[j];
        netInput = 0;

        inputCount = neuron.weights.length;

        //for each weight
        for (k = 0; k < inputCount - 1; k++) {

          //sum the weights x inputs
          netInput += neuron.weights[k] * inputs[weight++];
        }

        //add in the bias
        netInput += neuron.weights[inputCount - 1] * settings.bias;

        /*
         we can store the outputs from each layer as we generate them.
         The combined activation is first filtered through the sigmoid
         function
         */
        outputs.push(this.sigmoid(netInput, settings.activationResponse));

        weight = 0;
      }
    }

    if (settings.action !== null) {
      settings.action(outputs);
    }

    if (settings.goal !== null) {
      this.wisdom.rewards += settings.goal();
    }

    return this;
  },

  sigmoid: function (netInput, response) {
    return (1 / (1 + Math.exp(-netInput / response)));
  }
};

NeuralNet.defaults = {
  bias: -1,
  inputCount: 2,
  outputCount: 2,
  hiddenLayerCount: 1,
  activationResponse: 1,
  hiddenLayerNeuronCount: 6,
  maxPerturbation: 0.3,

  sense: null,
  goal: null,
  action: null
};
function randomClamped() {
  return Math.random() - Math.random();
}

function Neuron(inputCount) {
  this.weights = [];

  for (var i = 0; i <= inputCount; i++) {
    // Create random weight between -1 and 1
    this.weights.push(randomClamped());
  }
}function Synapses(neuronCount, inputCount) {
  this.neurons = [];
  for (var i = 0; i < neuronCount; i++) {
    this.neurons.push(new Neuron(inputCount));
  }
}
/**
 *
 * @param {number[]} weights
 * @param {number} maxPerturbation
 * @param {number} [rewards]
 * @constructor
 */
function Wisdom(weights, maxPerturbation, rewards) {
  this.weights = weights;
  this.maxPerturbation = maxPerturbation;
  this.rewards = rewards || 0;
}

Wisdom.prototype = {
  /**
   *
   * @returns {Wisdom}
   */
  hypothesize: function(mutationRate) {
    var i = 0,
        max = this.weights.length;

    for (; i < max; i++) {
      if (Math.random() < mutationRate) {
        this.weights[i] += (Math.random() - Math.random()) * this.maxPerturbation;
      }
    }
    return this;
  },
  reward: function() {
    this.rewards++;
    return this;
  }
};
/**
 * meta heuristic / genetic algorithm
 */

function MetaHeuristic(settings) {
  settings = settings || {};

  var defaults = MetaHeuristic.defaults,
    _settings = {},
    i,
    collection;

  this.collection = collection = [];
  this.learnCount = 0;
  this.totalRewards = 0;
  this.bestRewards = 0;
  this.avgRewards = 0;
  this.lowestRewards = MetaHeuristic.defaults.worstRewards;

  for (i in defaults) if (defaults.hasOwnProperty(i)) {
    _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
  }

  this.settings = _settings;

  for (i = 0; i < settings.count; i++) {
    collection.push(settings.initType());
  }

  this.learn();
}

MetaHeuristic.prototype = {
  /**
   *
   * @returns {MetaHeuristic}
   */
  learn: function () {
    this.learnCount++;
    this
      .calcStats()
      .optimize();

    var queue = [],
      i = 0,
      settings = this.settings,
      max = settings.count,
      maxPerturbation = settings.maxPerturbation,
      j;

    for(; i < max; i++) {
      if(Math.random() < maxPerturbation) {
        queue.push(i);
      }
    }

    shuffle(queue);

    for(i = 0, j = queue.length - 1; i < j; i += 2) {
      this
        .teach(queue[i], queue[i + 1])
        .teach(queue[i], queue[i + 1], true);
    }

    return this.mutate();
  },

  /**
   *
   * @returns {MetaHeuristic}
   */
  calcStats: function() {
    this.sort();
    this.totalRewards = 0;
    var bestRewards = 0,
      settings = this.settings,
      rewards,
      item,
      collection = this.collection,
      max = settings.count,
      lowestRewards = this.lowestRewards,
      i = 0;

    for (; i < max; i++) {
      item = collection[i];
      rewards = item.heuristic.rewards;
      if (rewards > bestRewards) {
        bestRewards = rewards;
        this.bestRewards = bestRewards;
      }

      if (rewards < lowestRewards) {
        lowestRewards = rewards;
        this.lowestRewards = lowestRewards;
      }
      this.totalRewards += rewards;
    }

    this.avgRewards = this.totalRewards / this.settings.count;
    return this;
  },

  /**
   *
   * @returns {MetaHeuristic}
   */
  optimize: function () {
    var parents = [],
        i = 4,
        max = this.settings.count,
        collection = this.collection;

    collection[1].heuristic.swap();
    collection[2].heuristic.exchange();

    parents.push(collection[0]);
    parents.push(collection[1]);
    parents.push(collection[2]);
    parents.push(collection[3]);

    for(; i < max; i++) {
      parents.push(this.select());
    }
    this.collection = parents;

    return this;
  },

  /**
   *
   * @param x
   * @param y
   * @param {Boolean} [backward]
   * @returns {MetaHeuristic}
   */
  teach: function (x, y, backward) {
    var settings = this.settings,
      filter = settings.filter,
      collection = this.collection,
      student = collection[backward ? y : x],
      leftSequence = collection[x].heuristic.settings.sequence.slice(0),
      left,
      rightSequence = collection[y].heuristic.settings.sequence.slice(0),
      right,
      sequence = [],
      randomIndex = Math.floor(Math.random() * (leftSequence.length - 1)),
      current,
      navigate = backward ? prevIn : nextIn;

    //a random starting point found in both left and right sequences
    current = leftSequence[randomIndex];
    sequence.push(current);
    while(leftSequence.length > 1) {
      left = navigate(leftSequence, leftSequence.indexOf(current));
      right = navigate(rightSequence, rightSequence.indexOf(current));
      deleteByValue(leftSequence, current);
      deleteByValue(rightSequence, current);
      current = filter(left, right, current);
      sequence.push(current);
    }

    if (student.heuristic.settings.sense !== null) {
      student.heuristic.settings.sense(sequence);
    }

    return this;
  },


  /**
   *
   * @returns {MetaHeuristic}
   */
  mutate: function () {
    var collection = this.collection,
        settings = this.settings,
        mutationProbability = settings.mutationProbability,
        max = settings.count,
        i = 0;

    for(; i < max; i++) {
      if(Math.random() < mutationProbability) {
        if(Math.random() > 0.5) {
          collection[i].heuristic.exchange();
        } else {
          collection[i].heuristic.swap();
        }
        i--;
      }
    }

    return this;
  },

  /**
   *
   * @param {Function} [each]
   * @returns {MetaHeuristic}
   */
  live: function (each) {
    var i = 0,
        collection = this.collection,
        max = collection.length,
        item;

    if (each === undefined) {
      for (; i < max; i++) {
        item = collection[i];
        item.heuristic.think();
      }
    } else {
      for (; i < max; i++) {
        item = collection[i];
        item.heuristic.think();
        each(item, i);
      }
    }
    return this;
  },

  /**
   *
   * @returns {MetaHeuristic}
   */
  sort: function () {
    this.settings.sort.call(this, this.collection);
    return this;
  },

  /**
   *
   * @returns {*}
   */
  select: function () {
    var middleIndex = Math.floor(this.settings.count / 2),
      indexBetweenMiddleAndHigh = Math.floor((Math.random() * middleIndex) + middleIndex);

    return this.collection[indexBetweenMiddleAndHigh];
  }
};

MetaHeuristic.defaults = {
  count: 30,
  maxPerturbation: 0.9,
  mutationProbability: 0.01,
  worstRewards: 9999999,
  filter: null,
  sort: function () {
    this.collection.sort(function(a, b) {
      return a.heuristic.rewards - b.heuristic.rewards;
    });
  }
};

function nextIn(array, index) {
  index++;
  if(index >= array.length) {
    index = 0;
  }

  return array[index];
}

function prevIn(array, index) {
  index--;
  if(index < 0) {
    index = array.length - 1;
  }

  return array[index];
}

function deleteByValue(array, value) {
  var pos = array.indexOf(value);
  array.splice(pos, 1);
}

function shuffle(array) {
  var counter = array.length, temp, index;

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    index = Math.floor(Math.random() * counter);

    // Decrease counter by 1
    counter--;

    // And swap the last element with it
    temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}
function Heuristic(settings) {
  settings = settings || {};
  var _settings = {},
    defaults = Heuristic.defaults,
    i;

  for (i in defaults) if (defaults.hasOwnProperty(i)) {
    _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
  }

  this.settings = _settings;
  this.rewards = 0;
  this.swapCount = 0;
  this.exchangeCount = 0;
}

Heuristic.prototype = {

  think: function() {
    return this.reward(this.settings.goal(this));
  },
  /**
   *
   * @param {number} reward
   * @returns {Heuristic}
   */
  reward: function(reward) {
    reward = (reward === undefined ? 1 : reward);
    this.rewards += reward;
    return this;
  },

  /**
   *
   * @returns {Heuristic}
   */
  clone: function() {
    var settings = this.settings,
        copy = new Heuristic({
          sequence: settings.sequence.slice(0),
          reward: settings.reward
        });

    copy.rewards = this.rewards;

    return copy;
  },

  /**
   *
   * @returns {Heuristic}
   */
  swap: function () {
    this.swapCount++;
    var m,
        settings = this.settings,
        sequence = settings.sequence.slice(0),
        n,
        i = 0,
        j;
    // m and n refers to the actual index in the array
    // m range from 0 to length-2, n range from 2...length-m
    do {
      m = Math.random() * (sequence.length - 2);
      n = Math.random() * sequence.length;
    } while (m >= n);

    for(j = (n - m + 1) >> 1; i < j; i++) {
      swap(sequence, m + i, n - i);
    }

    this.settings.sense(sequence);
    return this;
  },

  /**
   *
   * @returns {Heuristic}
   */
  exchange: function () {
    this.exchangeCount++;
    var m,
        n,
        settings = this.settings,
        sequence = settings.sequence.slice(0);

    do {
      m = Math.floor(Math.random() * (sequence.length >> 1));
      n = Math.floor(Math.random() * sequence.length);
    } while (m >= n);

    var s1 = sequence.slice(0, m),
        s2 = sequence.slice(m, n),
        s3 = sequence.slice(n, sequence.length);

    settings.sense(
      s2
        .concat(s1)
        .concat(s3)
    );

    return this;
  }
};

Heuristic.defaults = {
  sequence: [],
  goal: null,
  sense: function(newSequence) {
    this.settings.sequence = newSequence;
  }
};

function swap(array, x, y) {
  if(x > array.length || y > array.length || x === y) {
    return;
  }
  var tem = array[x];
  array[x] = array[y];
  array[y] = tem;
}

  return {
    Colony: Colony,
    Ant: Ant,
    Edge: Edge,
    Graph: Graph,
    Point: Point,
    Tour: Tour,

    Hive: Hive,
    NeuralNet: NeuralNet,
    Neuron: Neuron,
    Synapses: Synapses,
    Wisdom: Wisdom,

    MetaHeuristic: MetaHeuristic,
    Heuristic: Heuristic,

    shuffle: shuffle
  };
})();