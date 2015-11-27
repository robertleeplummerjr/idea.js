"use strict";

aco.Tour = (function () {
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
        i;
      for (i in points) if (points.hasOwnProperty(i)) {
        if (point.isEqual(this.points[i])) {
          return true;
        }
      }

      return false;
    },

    add: function(point) {
      this.distance = null;
      this.points.push(point);
      return this;
    },

    get: function(i) {
      return this.points[i];
    },

    updateDistance: function() {
      if (this.distance === null) {
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

        this.distance = distance;
      }

      return this.distance;
    }
  };

  return Tour;
})();