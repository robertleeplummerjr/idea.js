(function(SmartSweepers, Experience) {
	"use strict";

	var cloneSweeperVerts = function () {
			return [
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
		},

		cloneMineVerts = function () {
			return [
				{x: -1, y: -1},
				{x: -1, y: 1},
				{x: 1, y: 1},
				{x: 1, y: -1}
			];
		},

		Params = {
			pi: Math.PI,
			halfPi: Math.PI/2,
			twoPi: Math.PI * 2,
			windowWidth: 400,
			windowHeight: 400,
			framesPerSecond: 0,
			maxTurnRate: 0,
			maxSpeed: 0,
			sweeperScale: 0,
			numSweepers: 0,
			numMines: 0,
			numTicks: 0,
			mineScale: 0,
			crossoverRate: 0,
			mutationRate: 0,
			maxPerturbation: 0,
			eliteCount: 0,
			eliteCopiesCount: 0
		},
		Controller = function (ctx, params) {
			var key,
				i;

			if (params == undefined) params = {};

			for (key in Params) if (Params.hasOwnProperty(key)) {
				if (params[key] === undefined) {
					params[key] = Params[key];
				}
			}

			this.ctx = ctx;
			this.params = params;
			this.mines = [];
			this.numSweepers = params.numSweepers;
			this.numMines = params.numMines;
			this.numWeightsForNN = 0;

			// Keep Per generation
			this.avgFitness = [];

			// Keep Per generation
			this.bestFitness = [];

			// Cycles per generation? What does this mean?
			this.ticks = 0;

			// Current generation;
			this.generations = 0;

			// Dimension of window
			this.cxClient = params.windowWidth;
			this.cyClient = params.windowHeight;

			this.fastRender = false;
			this.viewPaths = false;

			this.hive = new brain.Hive(
				function() {
					return SmartSweepers.Sweeper(params);
				},
				this.numSweepers,
				params.mutationRate,
				params.crossoverRate,
				this.numWeightsForNN,
				params.maxPerturbation,
				params.eliteCount,
				params.eliteCopiesCount
			);

			for (i = 0; i < this.numMines; i++) {
				this.mines.push(new SmartSweepers.Vector2d(
					Math.random() * this.cxClient, Math.random() * this.cyClient));
			}
		};

	Controller.prototype = {
		render: function () {
			var i,
				g,
				ctx = this.ctx,
				mineVerts,
				sweeperVerts,
				sweeper,
				mine;

			ctx.clearRect(0, 0, this.params.windowWidth, this.params.windowHeight);
			ctx.beginPath();
			ctx.rect(0, 0, this.params.windowWidth, this.params.windowHeight);
			ctx.fillStyle = 'rgb(32, 36, 45)';
			ctx.fill();

			ctx.beginPath();
			for (i = 0; i < this.numMines; i++) {
				mineVerts = cloneMineVerts();
				mineVerts = this.worldTransform(mineVerts, this.mines[i]);
				ctx.moveTo(mineVerts[0].x, mineVerts[0].y);
				for (g = 1; g < mineVerts.length; g++) {
					ctx.lineTo(mineVerts[g].x, mineVerts[g].y);
				}
				ctx.lineTo(mineVerts[0].x, mineVerts[0].y);
			}
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgb(140, 177, 120)';
			ctx.stroke();

			ctx.beginPath();
			for (i = 0; i < this.numSweepers; i++) {
				sweeperVerts = this.hive.collection[i].worldTransform(cloneSweeperVerts());

				if (i == this.params.eliteCount) {
					ctx.lineWidth = 1;
					ctx.strokeStyle = 'rgb(176, 64, 60)';
					ctx.stroke();
					ctx.beginPath();
				}

				// Draw left track of sweeper
				ctx.moveTo(sweeperVerts[0].x, sweeperVerts[0].y);
				for (g = 1; g < 4; ++g) {
					ctx.lineTo(sweeperVerts[g].x, sweeperVerts[g].y);
				}
				ctx.lineTo(sweeperVerts[0].x, sweeperVerts[0].y);

				// Draw right track of sweeper
				ctx.moveTo(sweeperVerts[4].x, sweeperVerts[4].y);
				for (g = 5; g < 8; ++g) {
					ctx.lineTo(sweeperVerts[g].x, sweeperVerts[g].y);
				}
				ctx.lineTo(sweeperVerts[4].x, sweeperVerts[4].y);

				// Draw rest of sweeper
				ctx.moveTo(sweeperVerts[8].x, sweeperVerts[8].y);
				ctx.lineTo(sweeperVerts[9].x, sweeperVerts[9].y);

				ctx.moveTo(sweeperVerts[10].x, sweeperVerts[10].y);

				for (g = 11; g < 16; ++g) {
					ctx.lineTo(sweeperVerts[g].x, sweeperVerts[g].y);
				}
			}
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgb(123, 144, 164)';
			ctx.stroke();

			if (this.viewPaths) {
				ctx.beginPath();
				for (i = 0; i < this.numSweepers; i++) {
					sweeper = this.hive.collection[i];
					if (sweeper.iClosestMine < 0) continue;
					mine = this.mines[sweeper.iClosestMine];

					ctx.moveTo(sweeper.position.x, sweeper.position.y);
					ctx.lineTo(mine.x, mine.y);
				}
				ctx.lineWidth = 1;
				ctx.strokeStyle = 'rgb(255, 45, 3)';
				ctx.stroke();
			}
		},

		// Sets up translation matrices for mines and applies the world transform
		// to each vertex in the vertex buffer passed to this method.
		worldTransform: function (vBuffer, vPos) {
			var mat = new SmartSweepers.Matrix2d();
			mat = mat.scale(this.params.mineScale, this.params.mineScale);
			mat = mat.translate(vPos.x, vPos.y);
			return mat.transformPoints(vBuffer);
		},

		update: function () {
			var i,
				grabHit,
				sweeper;
			if (this.ticks++ < this.params.numTicks) {
				for (i = 0; i < this.numSweepers; i++) {
					sweeper = this.hive.collection[i];
					if (!sweeper.update(this.mines, this.hive.collection)) {
						console.log("Wrong amount of NN inputs!");
						return false;
					}
					grabHit = sweeper.checkForMine(this.mines, this.params.mineScale);
					if (grabHit >= 0) {
						this.hive.collection[i].fitness++;
						this.mines[grabHit] = new SmartSweepers.Vector2d(
							Math.random() * this.cxClient, Math.random() * this.cyClient);
					}
				}
			} else {
				this.avgFitness.push(this.hive.getAvgFitness());
				this.bestFitness.push(this.hive.getBestFitness());
				++this.generations;
				this.ticks = 0;
				this.hive.learn();
			}
			return true;
		},

		getFastRender: function () {
			return this.fastRender;
		},

		setFastRender: function (fastRender) {
			this.fastRender = fastRender;
		},

		toggleFasterRender: function () {
			this.fastRender = !this.fastRender;
		},

		getViewPaths: function () {
			return this.viewPaths;
		},

		setViewPaths: function (viewPaths) {
			this.viewPaths = viewPaths;
		},

		toggleViewPaths: function () {
			this.viewPaths = !this.viewPaths;
		}
	};

	SmartSweepers.Controller = Controller;
}(SmartSweepers));