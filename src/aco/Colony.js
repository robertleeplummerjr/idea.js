"use strict";

aco.Colony = (function () {
  function Colony(settings) {
    settings = settings || {};
    this.graph = new aco.Graph();
    this.colony = [];

    var _settings = {},
      defaults = Colony.defaults,
      i;
    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : _settings[i];
    }

    this.settings = _settings;
    this.iteration = 0;
    this.minPheromone = null;
    this.maxPheromone = null;
    this.iterationBest = null;
    this.globalBest = null;

    this.createAnts();
  }

  Colony.type = {
    acs: 0,
    maxmin: 1,
    elitist: 2
  };

  Colony.defaults = {
    colonySize: 20,
    alpha: 1,
    beta: 3,
    rho: 0.1,
    q: 1,
    initPheromone: 1,
    type: Colony.type.acs,
    elitistWeight: 0,
    maxIterations: 250,
    minScalingFactor: 0.001
  };

  Colony.prototype = {
    size: function() { return this.colony.length; },
    createAnts: function() {
      var i = 0,
        settings = this.settings,
        max = settings.colonySize;

      this.colony = [];
      for (; i < max; i++) {
        this.colony.push(new aco.Ant(this.graph, {
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
      this.resetAnts();
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

    resetAnts: function() {
      this.createAnts();
      this.iterationBest = null;
      return this;
    },

    ready: function() {
      return this.graph.size() > 1;
    },

    run: function() {
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
      if (!this.ready() || this.iteration >= this.settings.maxIterations) {
        return this;
      }

      this.resetAnts();

      var i,
        colony = this.colony;

      for (i in colony) if (colony.hasOwnProperty(i)) {
        colony[i].run();
      }

      this.getGlobalBest();
      this.updatePheromone();

      this.iteration++;
      return this;
    },

    updatePheromone: function() {
      var edges = this.graph.edges,
        settings = this.settings,
        rho = settings.rho,
        q = settings.q,
        type = settings.type,
        maxIterations = settings.maxIterations,
        minScalingFactor = settings.minScalingFactor,
        colony = this.colony,
        elitistWeight = this.elitistWeight,
        pheromone,
        best,
        i;

      for (i in edges) if (edges.hasOwnProperty(i)) {
        pheromone = edges[i].pheromone;
        edges[i].pheromone = pheromone * (1 - rho);
      }

      if (type === Colony.type.maxmin) {
        if ((this.iteration / maxIterations) > 0.75) {
          best = this.getGlobalBest();
        } else {
          best = this.getIterationBest();
        }

        // Set maxmin
        this.maxPheromone = q / best.getTour().updateDistance();
        this.minPheromone = this.maxPheromone * minScalingFactor;

        best.addPheromone();
      } else {
        for (i in colony) if (colony.hasOwnProperty(i)) {
          colony[i].addPheromone();
        }
      }

      if (type === Colony.type.elitist) {
        this.getGlobalBest().addPheromone(elitistWeight);
      }

      if (type === Colony.type.maxmin) {
        for (i in edges) if (edges.hasOwnProperty(i)) {
          pheromone = edges[i].pheromone;
          if (pheromone > this.maxPheromone) {
            edges[i].pheromone = this.maxPheromone;
          } else if (pheromone < this.minPheromone) {
            edges[i].pheromone = this.minPheromone;
          }
        }
      }
      return this;
    },

    getIterationBest: function() {
      if (this.colony[0].getTour() == null) {
        return null;
      }

      if (this.iterationBest == null) {
        var colony = this.colony,
          best = colony[0],
          i;

        for (i in colony) if (colony.hasOwnProperty(i)) {
          if (best.getTour().distance() >= this.colony[i].getTour().updateDistance()) {
            this.iterationBest = this.colony[i];
          }
        }
      }

      return this.iterationBest;
    },

    getGlobalBest: function() {
      var bestAnt = this.getIterationBest();

      if (bestAnt == null && this.globalBest == null) {
        return null;
      }

      if (bestAnt != null) {
        if (this.globalBest == null || this.globalBest.getTour().updateDistance() >= bestAnt.getTour().updateDistance()) {
          this.globalBest = bestAnt;
        }
      }

      return this.globalBest;
    }
  };

  return Colony;
})();