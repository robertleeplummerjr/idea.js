var Matrix2d = (function() {
    "use strict";

    function Matrix2d() {
        this.x = 0;
        this.y = 0;

        this.xScale = 1;
        this.yScale = 1;

        this.leftAngle = 0;
        this.rightAngle = 0;

        this._13 = 0;
        this._23 = 0;
        this._33 = 1;
    }

    Matrix2d.prototype = {
        translate: function(x, y) {
            var mat = new Matrix2d();
            mat.x = x;
            mat.y = y;
            return this.mul(mat);
        },
        scale: function(xScale, yScale) {
            var mat = new Matrix2d();
            mat.xScale = xScale;
            mat.yScale = yScale;
            return this.mul(mat);
        },
        rotate: function(rotation) {
            var mat = new Matrix2d(),
                sin = Math.sin(rotation),
                scale = Math.cos(rotation);

            mat.xScale = scale;
            mat.yScale = scale;

            mat.leftAngle = sin;
            mat.rightAngle = -sin;
            return this.mul(mat);
        },
        mul: function(rhs) {
            var matTemp = new Matrix2d();

            matTemp.x = (this.x * rhs.xScale) + (this.y * rhs.rightAngle) + (this._33 * rhs.x);
            matTemp.y = (this.x * rhs.leftAngle) + (this.y * rhs.yScale) + (this._33 * rhs.y);

            matTemp.xScale = (this.xScale * rhs.xScale) + (this.leftAngle * rhs.rightAngle) + (this._13 * rhs.x);
            matTemp.yScale = (this.rightAngle * rhs.leftAngle) + (this.yScale * rhs.yScale) + (this._23 * rhs.y);

            matTemp.leftAngle = (this.xScale * rhs.leftAngle) + (this.leftAngle * rhs.yScale) + (this._13 * rhs.y);
            matTemp.rightAngle = (this.rightAngle * rhs.xScale) + (this.yScale * rhs.rightAngle) + (this._23 * rhs.x);

            matTemp._13 = (this.xScale * rhs._13) + (this.leftAngle * rhs._23) + (this._13 * rhs._33);
            matTemp._23 = (this.rightAngle * rhs._13) + (this.yScale * rhs._23) + (this._23 * rhs._33);
            matTemp._33 = (this.x * rhs._13) + (this.y * rhs._23) + (this._33 * rhs._33);

            this.x = matTemp.x;
            this.y = matTemp.y;

            this.xScale = matTemp.xScale;
            this.yScale = matTemp.yScale;

            this.leftAngle = matTemp.leftAngle;
            this.rightAngle = matTemp.rightAngle;

            this._13 = matTemp._13;
            this._23 = matTemp._23;
            this._33 = matTemp._33;

            return this;
        },

        transformPoints: function(points) {
            var i = 0,
                    max = points.length,
                    point,
                    x,
                    y;

            for (; i < max; ++i) {
                point = points[i];
                x = (this.xScale * point.x) + (this.rightAngle * point.y) + (this.x);
                y = (this.yScale * point.y) + (this.leftAngle * point.x) + (this.y);
                point.x = x;
                point.y = y;
            }

            return points;
        }
    };

    return Matrix2d;
})();