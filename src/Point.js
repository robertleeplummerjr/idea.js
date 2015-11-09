var Point = (function() {
	"use strict";

	function Point(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}

	Point.prototype = {
		add: function(p) {
			this.x += p.x;
			this.y += p.y;
			return this;
		},
		sub: function(p) {
			this.x -= p.x;
			this.y -= p.y;
			return this;
		},
		mul: function(p) {
			this.x *= p.x;
			this.y *= p.y;
			return this;
		},
		div: function(p) {
			this.x /= p.x;
			this.y /= p.y;
			return this;
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
			this.x = this.x / root;
			this.y = this.y / root;
			return this;
		}
	};

	Point.add = function(p1, p2) {
		return new Point(p1.x + p2.x, p1.y + p2.y);
	};

  Point.sub = function(p1, p2) {
		return new Point(p1.x - p2.x, p1.y - p2.y);
	};

  Point.mul = function(p1, p2) {
		return new Point(p1.x * p2.x, p1.y * p2.y);
	};

  Point.div = function(p1, p2) {
		return new Point(p1.x / p2.x, p1.y / p2.y);
	};

	// Use Pythagorean to find hypotenuse
  Point.root = function(v) {
		return Math.sqrt(v.x * v.x + v.y * v.y);
	};

	// Calculate dot product
  Point.dot = function(p1, p2) {
		return p1.x * p2.x + p1.y * p2.y;
	};

	// Find sign of vector. If positive, the p2 is clockwise of p1.
	// Anticlockwise if negative
  Point.sign = function(p1, p2) {
		if (p1.y * p2.x > p1.x * p2.y) {
			return 1;
		} else {
			return -1;
		}
	};

  return Point;
})();