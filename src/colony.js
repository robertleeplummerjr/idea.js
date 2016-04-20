'use strict';

var Graph = require('colony/graph'),
  Ant = require('colony/ant');

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
};

module.exports = Colony;