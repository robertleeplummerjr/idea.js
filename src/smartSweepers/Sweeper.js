smartSweepers.Sweeper = (function(smartSweepers, brain) {
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
		var config = Sweeper.config;

		this.brain = new brain.NeuralNet({
			bias: config.neuralNetBias,
			inputCount: config.neuralNetInputCount,
			outputCount: config.neuralNetOutputCount,
			hiddenLayerCount: config.neuralNetHiddenLayerCount,
			activationResponse: config.neuralNetActivationResponse,
			hiddenLayerNeuronCount: config.neuralNetHiddenLayerNeuronCount,
			maxPerturbation: params.maxPerturbation
		});

    this.params = params;
		this.position = new Point(Math.random() * params.windowWidth, Math.random() * params.windowHeight);
		this.direction = new Point();
		this.rotation = Math.random() * Math.PI * 2;
		this.speed = 0;
		this.lTrack = 0.16;
		this.rTrack = 0.16;
		this.scale = params.sweeperScale;
		this.iClosestMine = 0;
	}

	// Update SmartSweeper position using neural network
	Sweeper.prototype = {
		/**
		 * First we take sensor readings and feed these into the sweepers brain. We receive two outputs from the brain.. lTrack & rTrack.
		 * So given a force for each track we calculate the resultant rotation
		 * and acceleration and apply to current velocity vector.
		 * @param {Object} mines sweepers 'look at' vector (x, y)
		 * @returns {boolean}
		 */
		update: function(mines, sweepers) {
			//this will store all the inputs for the NN
			var inputs = [],

				//get closest mine
				closestMine = this.getClosestMine(mines)
					.normalize(),
        closestSweeper = this.getClosestSweeper(sweepers)
					.normalize();

			this.closestMine = closestMine;
      this.closestSweeper = closestSweeper;

			//add in vector to closest mine
			inputs.push(closestMine.x);
			inputs.push(closestMine.y);

      inputs.push(closestSweeper.x);
      inputs.push(closestSweeper.y);

			//add in sweepers look at vector
			inputs.push(this.direction.x);
			inputs.push(this.direction.y);

      inputs.push(this.speed);

			//update the brain and get feedback
			var output = this.brain.update(inputs);

			//make sure there were no errors in calculating the
			//output
			if (output.length < Sweeper.config.outputCount) {
				return false;
			}

			//assign the outputs to the sweepers left & right tracks
			this.lTrack = output[0];
			this.rTrack = output[1];

			//calculate steering forces
			var rotForce = this.lTrack - this.rTrack;

			//clamp rotation
			rotForce = clamp(rotForce, -this.params.maxTurnRate, this.params.maxTurnRate);

			// Rotate sweeper
			this.rotation += rotForce;

			this.speed = (this.lTrack + this.rTrack);

			//update Look At
			this.direction.x = -Math.sin(this.rotation);
			this.direction.y = Math.cos(this.rotation);

			//update position
			this.position.x += this.speed * this.direction.x;
			this.position.y += this.speed * this.direction.y;

			//wrap around window limits
			// Make sure position is not out of the window
			if (this.position.x > this.params.windowWidth) {
				this.position.x = 0;
			}

			if (this.position.x < 0) {
				this.position.x = this.params.windowWidth;
			}

			if (this.position.y > this.params.windowHeight) {
				this.position.y = 0;
			}

			if (this.position.y < 0) {
				this.position.y = this.params.windowHeight;
			}

			return true;
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


		getClosestMine: function(mines) {
			var closestMineDist = 99999,
					closestMine = null,
					i = 0,
          mine,
					distToMine;

			for (; i < mines.length; i++) {
        mine = mines[i];
        distToMine = mine
					.sub(this.position)
					.root();

				if (distToMine < closestMineDist) {
					closestMineDist = distToMine;
					closestMine = Point.sub(this.position, mine);
					this.iClosestMine = i;
				}
			}
			return closestMine;
		},

    getClosestSweeper: function(sweepers) {
      var closestSweeperDist = 99999,
      	closestSweeper = null,
				i = 0;
      for (; i < sweepers.length; i++) {
        if (this === sweepers[i]) continue;

        var dist = Point.length(Point.sub(sweepers[i].position, this.position));
        if (dist < closestSweeperDist) {
          closestSweeperDist = dist;
          closestSweeper = Point.sub(this.position, sweepers[i].position);
          this.iClosestSweeper = i;
        }
      }
      return closestSweeper;
    },

		checkForMine: function(mines, size) {
			var distToMine = Point.sub(this.position, mines[this.iClosestMine]);
			if (Point.length(distToMine) < (size + 5)) {
				return this.iClosestMine;
			}
			return -1;
		},

		reset: function() {
			this.position = new Point(Math.random() * this.params.windowWidth, Math.random() * this.params.windowHeight);
			this.brain.wisdom.rewards = 0;
			this.rotation = Math.random() * this.params.twoPi;
		}
	};

	Sweeper.config = {
		neuralNetBias: -1,
		neuralNetInputCount: 7,
		neuralNetOutputCount: 2,
		neuralNetHiddenLayerCount: 1,
    neuralNetHiddenLayerNeuronCount: 6,
		neuralNetActivationResponse: 1,
		neuralNetPerturbation: 0.3
	};

  return Sweeper;
})(smartSweepers, brain);