'use strict';

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

module.exports = Point;