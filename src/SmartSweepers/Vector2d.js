(function(SmartSweepers) {
	"use strict";

	function Vector2d (x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}

	Vector2d.prototype = {
		add: function (rhs) {
			this.x += rhs.x;
			this.y += rhs.y;
			return this;
		},
		sub: function (rhs) {
			this.x -= rhs.x;
			this.y -= rhs.y;
			return this;
		},
		mul: function (rhs) {
			this.x *= rhs.x;
			this.y *= rhs.y;
			return this;
		},
		div: function (rhs) {
			this.x /= rhs.x;
			this.y /= rhs.y;
			return this;
		}
	};

	SmartSweepers.Vector2d = Vector2d;

	SmartSweepers.vector2dAdd = function(lhs, rhs) {
		return new Vector2d(lhs.x + rhs.x, lhs.y + rhs.y);
	};

	SmartSweepers.vector2dSub = function(lhs, rhs) {
		return new Vector2d(lhs.x - rhs.x, lhs.y - rhs.y);
	};

	SmartSweepers.vector2dMul = function(lhs, rhs) {
		return new Vector2d(lhs.x * rhs.x, lhs.y * rhs.y);
	};

	SmartSweepers.vector2dDiv = function(lhs, rhs) {
		return new Vector2d(lhs.x / rhs.x, lhs.y / rhs.y);
	};

	// Use Pythagorean to find hypotenuse
	SmartSweepers.vector2dLength = function(vector2d) {
		return Math.sqrt(vector2d.x * vector2d.x + vector2d.y * vector2d.y);
	};

	// Calculate dot product
	SmartSweepers.vector2dDot = function(v1, v2) {
		return v1.x * v2.x + v1.y * v2.y;
	};

	// Find sign of vector. If positive, the v2 is clockwise of v1.
	// Anticlockwise if negative
	SmartSweepers.vector2dSign = function(v1, v2) {
		if (v1.y * v2.x > v1.x * v2.y) {
			return 1;
		} else {
			return -1;
		}
	};

	SmartSweepers.vector2dNormalize = function(v) {
		var vLength = SmartSweepers.vector2dLength(v);
		v.x = v.x / vLength;
		v.y = v.y / vLength;
		return v;
	};
})(SmartSweepers);