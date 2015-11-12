smartSweepers.Sweeper = (function(smartSweepers, idea) {
  "use strict";

  function clamp(arg, min, max) {
    if (arg < min) {
      arg = min;
    }

    if (arg > max) {
      arg = max;
    }

    return arg;
  }

  function Sweeper(params) {
    var config = Sweeper.config,
        self = this;

    this.brain = new idea.NeuralNet({
      bias: config.neuralNetBias,
      inputCount: config.neuralNetInputCount,
      outputCount: config.neuralNetOutputCount,
      hiddenLayerCount: config.neuralNetHiddenLayerCount,
      activationResponse: config.neuralNetActivationResponse,
      hiddenLayerNeuronCount: config.neuralNetHiddenLayerNeuronCount,
      maxPerturbation: config.neuralNetPerturbation,
      sense: function() {
        var inputs = [];

        //add in vectors to closest mine
        self.closestMine.position
          .normalize()
          .pushTo(inputs);

        //add in vectors to the closest sweeper
        self.closestSweeper.position
          .normalize()
          .pushTo(inputs);

        //add in vectors of the direction the closest sweeper is moving
        self.closestSweeper.direction
          .normalize()
          .pushTo(inputs);

        self.direction
          .normalize()
          .pushTo(inputs);

        inputs.push(self.speed);

        return inputs;
      },
      goal: function() {
        var hit = self.checkForMine();
        if (hit) {
          params.hit(self.closestMine);
          return 1;
        }
        return 0;
      },
      action: function(movements) {
        if (movements.length < Sweeper.config.neuralNetOutputCount) {
          return;
        }

        //assign the outputs to the sweepers left & right tracks
        self.lTrack = movements[0];
        self.rTrack = movements[1];
      }
    });

    this.params = params;
    this.position = new Point(Math.random() * params.fieldWidth, Math.random() * params.fieldHeight);
    this.direction = new Point();
    this.rotation = Math.random() * Math.PI * 2;
    this.speed = 0;
    this.lTrack = 0.16;
    this.rTrack = 0.16;
    this.scale = Sweeper.config.scale;
    this.closestMine = null;
  }

  Sweeper.prototype = {
    /**
     * move a sweeper and update it's location relative to the field it is in
     * @param {smartSweepers.Mine[]} mines
     * @param {smartSweepers.Sweeper[]} sweepers
     * @returns {boolean}
     */
    move: function(mines, sweepers) {
      this
          .updateClosestMine(mines)
          .updateClosestSweeper(sweepers);

      this.brain.think();

      //calculate steering forces
      var params = this.params,
          rotForce = this.lTrack - this.rTrack,
          //clamp rotation
          rotForceClamped = clamp(rotForce, -params.maxTurnRate, params.maxTurnRate),
          // Rotate sweeper
          rotation = this.rotation += rotForceClamped,
          speed = this.speed = (this.lTrack + this.rTrack),
          direction = this.direction,
          position = this.position;

      //update Look At
      direction.x = -Math.sin(rotation);
      direction.y = Math.cos(rotation);

      //update position
      position.x += speed * direction.x;
      position.y += speed * direction.y;

      //wrap around window limits
      // Make sure position is not out of the field
      if (position.x > params.fieldWidth) {
        position.x = 0;
      }

      if (position.x < 0) {
        position.x = params.fieldWidth;
      }

      if (position.y > params.fieldHeight) {
        position.y = 0;
      }

      if (position.y < 0) {
        position.y = params.fieldHeight;
      }
    },
    worldTransform: function() {
      var points = [
          {x: -1, y: -1},
          {x: -1, y: 1},
          {x: -0.5, y: 1},
          {x: -0.5, y: -1},

          {x: 0.5, y: -1},
          {x: 1, y: -1},
          {x: 1, y: 1},
          {x: 0.5, y: 1},

          {x: -0.5, y: -0.5},
          {x: 0.5, y: -0.5},

          {x: -0.5, y: 0.5},
          {x: -0.25, y: 0.5},
          {x: -0.25, y: 1.75},
          {x: 0.25, y: 1.75},
          {x: 0.25, y: 0.5},
          {x: 0.5, y: 0.5}
        ];

      return (new Matrix2d())
        .scale(this.scale, this.scale)
        .rotate(this.rotation)
        .translate(this.position.x, this.position.y)
        .transformPoints(points);
    },


    updateClosestMine: function(mines) {
      var closestMineDist = 99999,
          i = 0,
          mine,
          distToMine;

      for (; i < mines.length; i++) {
        mine = mines[i];
        distToMine = this.distance(mine);

        if (distToMine < closestMineDist) {
          closestMineDist = distToMine;
          this.closestMine = mine;
        }
      }

      return this;
    },

    updateClosestSweeper: function(sweepers) {
      var closestSweeperDist = 99999,
          max = sweepers.length,
          sweeper,
          dist,
          i = 0;

      for (; i < max; i++) {
        sweeper = sweepers[i];
        if (this === sweeper) continue;

        dist = sweeper.distance(this);
        if (dist < closestSweeperDist) {
          closestSweeperDist = dist;
          this.closestSweeper = sweeper;
        }
      }
      return this;
    },

    distance: function(entity) {
      return this.position.distance(entity.position);
    },

    checkForMine: function() {
      var distToMine = this.distance(this.closestMine);
      return (distToMine < (smartSweepers.Mine.config.scale + 5));
    }
  };

  Sweeper.config = {
    neuralNetBias: -1,
    neuralNetInputCount: 9,
    neuralNetOutputCount: 2,
    neuralNetHiddenLayerCount: 1,
    neuralNetHiddenLayerNeuronCount: 6,
    neuralNetActivationResponse: 1,
    neuralNetPerturbation: 0.3,
    scale: 5
  };

  Sweeper.defaults = {
    hit: null,
    fieldHeight: 1,
    fieldWidth: 1,
    maxTurnRate: 1
  };

  return Sweeper;
})(smartSweepers, idea);