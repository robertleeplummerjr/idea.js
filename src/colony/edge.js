'use strict';

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
};

module.exports = Edge;