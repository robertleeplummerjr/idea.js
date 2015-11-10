var Point = (function() {
  "use strict";

  function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  Point.prototype = {
    add: function(p) {
      return new Point(this.x + p.x, this.y + p.y);
    },
    sub: function(p) {
      return new Point(this.x - p.x, this.y - p.y);
    },
    mul: function(p) {
      return new Point(this.x * p.x, this.y * p.y);
    },
    div: function(p) {
      return new Point(this.x / p.x, this.y / p.y);
    },
    root: function() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    sign: function(p) {
      if (this.y * p.x > this.x * p.y) {
        return 1;
      } else {
        return -1;
      }
    },
    normalize: function() {
      var root = this.root();
      return new Point(this.x / root, this.y / root);
    },
    distance: function(p) {
      return p
          .sub(this)
          .root();
    }
  };
  return Point;
})();