smartSweepers.Controller = (function(smartSweepers) {
    "use strict";

  function Controller(ctx, params) {
    var key,
        i,
        defaults = Controller.defaults;

    params = params || {};

    for (key in defaults) if (defaults.hasOwnProperty(key)) {
      if (params[key] === undefined) {
        params[key] = defaults[key];
      }
    }

    this.ctx = ctx;
    this.params = params;
    this.mines = [];
    this.numSweepers = params.numSweepers;
    this.numMines = params.numMines;
    this.numWeightsForNN = 0;

    // Keep Per generation
    this.avgRewards = [];

    // Keep Per generation
    this.bestRewards = [];

    // Cycles per generation? What does this mean?
    this.ticks = 0;

    // Current generation;
    this.generations = 0;

    // Dimension of window
    this.width = params.windowWidth;
    this.height = params.windowHeight;

    this.fastRender = false;
    this.viewPaths = false;

    this.hive = new brain.Hive(
      function() {
        return new smartSweepers.Sweeper(params);
      },
      this.numSweepers,
      params.mutationRate,
      params.crossoverRate,
      this.numWeightsForNN,
      params.maxPerturbation,
      params.eliteCount
    );

    for (i = 0; i < this.numMines; i++) {
      this.mines.push(new smartSweepers.Mine(Math.random() * this.width, Math.random() * this.height));
    }
  }

    Controller.prototype = {
      render: function() {
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
          mineVerts = this.mines[i].worldTransform();
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
          sweeperVerts = this.hive.collection[i].worldTransform();

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
            ctx.lineTo(mine.position.x, mine.position.y);
          }
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgb(255, 45, 3)';
          ctx.stroke();
        }
      },

      update: function() {
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
              this.hive.collection[i].brain.wisdom.reward();
              this.mines[grabHit] = new smartSweepers.Mine(Math.random() * this.width, Math.random() * this.height);
            }
          }
        } else {
          this.avgRewards.push(this.hive.avgRewards);
          this.bestRewards.push(this.hive.bestRewards);
          this.hive.reset();
          this.generations++;
          this.ticks = 0;
          this.hive.learn();
        }
        return true;
      },

      getFastRender: function() {
        return this.fastRender;
      },

      setFastRender: function(fastRender) {
        this.fastRender = fastRender;
      },

      toggleFasterRender: function() {
        this.fastRender = !this.fastRender;
      },

      getViewPaths: function() {
        return this.viewPaths;
      },

      setViewPaths: function(viewPaths) {
        this.viewPaths = viewPaths;
      },

      toggleViewPaths: function() {
        this.viewPaths = !this.viewPaths;
      }
    };

  Controller.defaults = {
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
    eliteCount: 5
  };

  return Controller;
}(smartSweepers));