"use strict";

aco.Graph = (function () {
  function Graph() {
    this.points = [];
    this.edges = {};
    this.edgeCount = 0;
  }

  Graph.prototype = {
    size: function() {
      return this.points.length;
    },

    addPoint: function(x, y) {
      this.points.push(new aco.Point(x, y));
      return this;
    },

    addEdge: function(pointA, pointB) {
      var key = pointA.toString() + '-' + pointB.toString();
      this.edges[key] = new aco.Edge(pointA, pointB);
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

  return Graph;
})();