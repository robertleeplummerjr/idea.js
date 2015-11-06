(function(SmartSweepers) {
	"use strict";

	var Matrix2d = function() {
		this.identity();
	};

	Matrix2d.prototype = {
		identity: function() {
			this._11 = 1; this._12 = 0; this._13 = 0;
			this._21 = 0; this._22 = 1; this._23 = 0;
			this._31 = 0; this._32 = 0; this._33 = 1;
		},
		translate: function(x, y) {
			var mat = new Matrix2d();
			mat._11 = 1; mat._12 = 0; mat._13 = 0;
			mat._21 = 0; mat._22 = 1; mat._23 = 0;
			mat._31 = x; mat._32 = y; mat._33 = 1;
			return this.mul(mat);
		},
		scale: function(xScale, yScale) {
			var mat = new Matrix2d();
			mat._11 = xScale; mat._12 = 0; mat._13 = 0;
			mat._21 = 0; mat._22 = yScale; mat._23 = 0;
			mat._31 = 0; mat._32 = 0; mat._33 = 1;
			return this.mul(mat);
		},
		rotate: function(rotation) {
			var mat = new Matrix2d();
			var sin = Math.sin(rotation);
			var cos = Math.cos(rotation);
			mat._11 = cos; mat._12 = sin; mat._13 = 0;
			mat._21 = -sin; mat._22 = cos; mat._23 = 0;
			mat._31 = 0; mat._32 = 0; mat._33 = 1;
			return this.mul(mat);
		},
		mul: function(rhs) {
			var matTemp = new Matrix2d();

			matTemp._11 = (this._11 * rhs._11) + (this._12 * rhs._21) + (this._13 * rhs._31);
			matTemp._12 = (this._11 * rhs._12) + (this._12 * rhs._22) + (this._13 * rhs._32);
			matTemp._13 = (this._11 * rhs._13) + (this._12 * rhs._23) + (this._13 * rhs._33);

			//second
			matTemp._21 = (this._21 * rhs._11) + (this._22 * rhs._21) + (this._23 * rhs._31);
			matTemp._22 = (this._21 * rhs._12) + (this._22 * rhs._22) + (this._23 * rhs._32);
			matTemp._23 = (this._21 * rhs._13) + (this._22 * rhs._23) + (this._23 * rhs._33);

			//third
			matTemp._31 = (this._31 * rhs._11) + (this._32 * rhs._21) + (this._33 * rhs._31);
			matTemp._32 = (this._31 * rhs._12) + (this._32 * rhs._22) + (this._33 * rhs._32);
			matTemp._33 = (this._31 * rhs._13) + (this._32 * rhs._23) + (this._33 * rhs._33);

			this._11 = matTemp._11;
			this._12 = matTemp._12;
			this._13 = matTemp._13;
			this._21 = matTemp._21;
			this._22 = matTemp._22;
			this._23 = matTemp._23;
			this._31 = matTemp._31;
			this._32 = matTemp._32;
			this._33 = matTemp._33;

			return this;
		},

		transformPoints: function(vPoint) {
			for (var i=0; i < vPoint.length; ++i) {
				var tempX = (this._11 * vPoint[i].x) + (this._21 * vPoint[i].y) + (this._31);
				var tempY = (this._12 * vPoint[i].x) + (this._22 * vPoint[i].y) + (this._32);
				vPoint[i].x = tempX;
				vPoint[i].y = tempY;
			}

			return vPoint;
		}
	};

	SmartSweepers.Matrix2d = Matrix2d;
}(SmartSweepers));