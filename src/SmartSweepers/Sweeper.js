(function(SmartSweepers, brain) {
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
		this.position = new SmartSweepers.Vector2d(Math.random() * params.windowWidth, Math.random() * params.windowHeight);
		this.direction = new SmartSweepers.Vector2d();
		this.rotation = Math.random() * params.twoPi;
		this.speed = 0;
		this.lTrack = 0.16;
		this.rTrack = 0.16;
		this.fitness = 0;
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
		update: function (mines, sweepers) {
			//this will store all the inputs for the NN
			var inputs = [],

			//get vector to closest mine
				closestMineRaw = this.getClosestMine(mines),
        closestSweeperRaw = this.getClosestSweeper(sweepers),

			//normalise it
				closestMine = SmartSweepers.vector2dNormalize(closestMineRaw),
				closestSweeper = SmartSweepers.vector2dNormalize(closestSweeperRaw);

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

		// Where does vector Spoints come from?
		worldTransform: function (sweeperVerts) {
			var mat = new SmartSweepers.Matrix2d();
			mat = mat.scale(this.scale, this.scale);
			mat = mat.rotate(this.rotation);
			mat = mat.translate(this.position.x, this.position.y);
			return mat.transformPoints(sweeperVerts);
		},


		getClosestMine: function (mines) {
			var closestMineDist = 99999;
			var closestMine = null;
			for (var i = 0; i < mines.length; i++) {
				var distToMine = SmartSweepers.vector2dLength(SmartSweepers.vector2dSub(mines[i], this.position));
				if (distToMine < closestMineDist) {
					closestMineDist = distToMine;
					closestMine = SmartSweepers.vector2dSub(this.position, mines[i]);
					this.iClosestMine = i;
				}
			}
			return closestMine;
		},

    getClosestSweeper: function (sweepers) {
      var closestSweeperDist = 99999;
      var closestSweeper = null;
      for (var i = 0; i < sweepers.length; i++) {
        if (this === sweepers[i]) continue;

        var dist = SmartSweepers.vector2dLength(SmartSweepers.vector2dSub(sweepers[i].position, this.position));
        if (dist < closestSweeperDist) {
          closestSweeperDist = dist;
          closestSweeper = SmartSweepers.vector2dSub(this.position, sweepers[i].position);
          this.iClosestSweeper = i;
        }
      }
      return closestSweeper;
    },

		checkForMine: function (mines, size) {
			var distToMine = SmartSweepers.vector2dSub(this.position, mines[this.iClosestMine]);
			if (SmartSweepers.vector2dLength(distToMine) < (size + 5)) {
				return this.iClosestMine;
			}
			return -1;
		},

		reset: function () {
			this.position = new SmartSweepers.Vector2d(Math.random() * this.params.windowWidth, Math.random() * this.params.windowHeight);
			this.fitness = 0;
			this.rotation = Math.random() * this.params.twoPi;
		},

		incrementFitness: function () {
			this.fitness++;
		},

		getFitness: function () {
			return this.fitness;
		},

		getNumWeights: function () {
			return this.brain.getNumWeights();
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

	SmartSweepers.Sweeper = Sweeper;
})(SmartSweepers, brain);