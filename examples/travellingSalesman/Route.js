var Route = (function() {
  function distance(p1, p2){
    return Math.sqrt((p1.x-p2.x)*(p1.x-p2.x) + (p1.y-p2.y)*(p1.y-p2.y));
  }

  function clean(points) {
    return points.filter(function (n) {
      return n !== null && n !== undefined;
    });
  }

  function checkLineIntersection(line1Start, line1End, line2Start, line2End) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    var a,
        b,
        numerator1,
        numerator2,
        denominator = (
                (line2End.y - line2Start.y)
                * (line1End.x - line1Start.x)
            )
            - (
                (line2End.x - line2Start.x)
                * (line1End.y - line1Start.y)
            );

    if (denominator == 0) {
      return false;
    }

    a = line1Start.y - line2Start.y;
    b = line1Start.x - line2Start.x;
    numerator1 = ((line2End.x - line2Start.x) * a) - ((line2End.y - line2Start.y) * b);
    numerator2 = ((line1End.x - line1Start.x) * a) - ((line1End.y - line1Start.y) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    if (a > 0 && a < 1) {
      return true;
    } else if (b > 0 && b < 1) {
      return true;
    }
    return false;
  }

  function Route(points) {
    if (points instanceof Array) {
      this.points = points;
    } else {
      this.points = [];
    }
    this.distance = null;
    this.points = clean(this.points);
    this.updateDistance();
  }

  Route.prototype = {
    clone: function() {
      var route = new Route(this.points.slice(0));
      route.distance = this.distance + 0;
      return this;
    },
    shuffleClone: function() {
      var array = this.points.slice(0);
      idea.shuffle(array);
      return new Route(array);
    },
    updateDistance: function() {
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
      this.distance = Math.round(sum);
      return this;
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
    },
    flatten: function() {
      var points = this.points,
        point,
        distances = this.distances(),
        distance,
        i = 0,
        max = points.length,
        flat = [];

      for (; i < max; i++) {
        distance = distances[i];
        point = points[i];
        flat.push(point.x);
        flat.push(point.y);
        flat.push(distance);
      }
      return flat;
    },
    anyPoint: function() {
      var points = this.points,
        i = Math.floor(Math.random() * (points.length - 1));

      return points[i];
    },
    intersectCount: function() {
      var points = this.points,
          line1Start,
          line1End,
          line2Start,
          line2End,
          i = 0,
          j,
          sum = 0,
          max = points.length;

      for (; i < max;) {
        line1Start = points[i++];
        line1End = points[i++];
        j = 0;
        for (; j < max; i++) {
          line2Start = points[j++];
          line2End = points[j++];
          if (line2Start === line1Start || line2Start === line1End) continue;
          if (line2End === line1Start || line2End === line1End) continue;
          if (checkLineIntersection(line1Start, line1End, line2Start, line2End)) {
            sum++;
          }
        }
      }

      return sum;
    }
  };

  Route.createRandom = function(settings) {
    var count = settings.count,
      width = settings.width,
      height = settings.height,
      points = [],
      point,
      i = 0;

    for(;i < count; i++) {
      point = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height)
      };
      points.push(point);
    }
    return new Route(points);
  };

  return Route;
})();