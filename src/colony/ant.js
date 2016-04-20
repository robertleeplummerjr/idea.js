'use strict';

var Tour = require('tour');

function Ant(graph, settings) {
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

module.exports = Ant;