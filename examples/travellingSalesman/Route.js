var Route = (function() {
  function distance(p1, p2){
    return Math.sqrt((p1.x-p2.x)*(p1.x-p2.x) + (p1.y-p2.y)*(p1.y-p2.y));
  }

  function Route(points) {
    if (points instanceof Array) {
      this.points = points;
    } else {
      this.points = [];
    }
  }

  Route.prototype = {
    createRandom: function(settings) {
      var count = settings.count,
        width = settings.width,
        height = settings.height,
        points = this.points,
        point,
        i = 0;

      for(;i < count; i++) {
        point = {
          x: Math.floor(Math.random() * width),
          y: Math.floor(Math.random() * height)
        };
        points.push(point);
      }
      return this;
    },
    clone: function() {
      return new Route(this.points.slice(0));
    },
    clean: function() {
      this.points = this.points.filter(function (n) {
        return n !== null && n !== undefined;
      });
      return this;
    },
    distance: function() {
      var sum = 0,
        points = this.points,
        point,
        previousPoint = points[0],
        i = 1,
        max = points.length;

      sum += distance(points[points.length - 1], points[0]);
      for(;i < max; i++) {
        point = points[i];
        sum += distance(previousPoint, point);
        previousPoint = point;
      }
      return sum;
    },
    distances: function() {
      var distances = [],
        points = this.points,
        point,
        previousPoint = points[0],
        i = 1,
        max = points.length;

      distances.push(distance(points[points.length - 1], points[0]));
      for(;i < max; i++) {
        point = points[i];
        distances.push(distance(previousPoint, point));
        previousPoint = point;
      }
      return distances;
    }
  };

  return Route;
})();