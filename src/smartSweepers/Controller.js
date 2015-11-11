smartSweepers.Controller = (function(smartSweepers) {
  "use strict";

  function Controller(ctx, params) {
    var key,
        i,
        defaults = Controller.defaults,
        self = this;

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

    // Keep Per day
    this.avgMinesHistory = [];
    this.avgMines = 0;

    // Keep Per days
    this.bestMinesHistory = [];
    this.bestMines = 0;

    this.ticks = 0;

    // Current day;
    this.day = 0;

    // Dimension of window
    this.width = params.windowWidth;
    this.height = params.windowHeight;

    this.fastRender = false;
    this.viewPaths = false;

    this.hive = new idea.Hive(
      function() {
        return new smartSweepers.Sweeper({
          fieldWidth: params.windowWidth,
          fieldHeight: params.windowHeight,
          hit: function(mine) {
            var i = self.mines.indexOf(mine);
            self.mines[i] = new smartSweepers.Mine(Math.random() * self.width, Math.random() * self.height);
          }
        });
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
        return this
            .drawBackground()
            .drawMines()
            .drawSweepers()
            .drawViewPaths();
      },
      drawBackground: function() {
        var ctx = this.ctx;

        ctx.clearRect(0, 0, this.params.windowWidth, this.params.windowHeight);
        ctx.beginPath();
        ctx.rect(0, 0, this.params.windowWidth, this.params.windowHeight);
        ctx.fillStyle = 'rgb(32, 36, 45)';
        ctx.fill();

        return this;
      },
      drawMines: function() {
        var ctx = this.ctx,
            i = 0,
            max = this.numMines,
            mineVerts,
            g;

        ctx.beginPath();
        for (; i < max; i++) {
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
        return this;
      },
      drawSweepers: function() {
        var i = 0,
            max = this.numSweepers,
            sweeperVerts,
            hive = this.hive,
            elites = hive.elites,
            sweepers = hive.collection,
            isElite,
            sweeper,
            g;

        this.hive.sort();

        for (;i < max; i++) {
          sweeper = sweepers[i];
          sweeperVerts = sweeper.worldTransform();

          ctx.beginPath();
          isElite = elites.indexOf(sweeper) > -1;

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

          if (isElite) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgb(176, 64, 60)';
            ctx.stroke();
          } else {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgb(123, 144, 164)';
            ctx.stroke();
          }
        }
        return this;
      },
      drawViewPaths: function() {
        var ctx = this.ctx,
            i = 0,
            maxMines = this.numSweepers,
            maxSweepers = this.numSweepers,
            sweeper,
            mine,
            closestSweeper;

        if (this.viewPaths) {
          //mines first
          ctx.beginPath();
          for (; i < maxMines; i++) {
            sweeper = this.hive.collection[i];
            if (sweeper.closestMine === null) continue;
            mine = sweeper.closestMine;
            ctx.moveTo(sweeper.position.x, sweeper.position.y);
            ctx.lineTo(mine.position.x, mine.position.y);
          }
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgb(255, 45, 3)';
          ctx.stroke();

          //closest sweepers second
          ctx.beginPath();
          i = 0;
          for (; i < maxSweepers; i++) {
            sweeper = this.hive.collection[i];
            if (sweeper.closestSweeper === null) continue;
            closestSweeper = sweeper.closestSweeper;
            ctx.moveTo(sweeper.position.x, sweeper.position.y);
            ctx.lineTo(closestSweeper.position.x, closestSweeper.position.y);
          }
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgb(0, 154, 15)';
          ctx.stroke();
        }
        return this;
      },

      update: function() {
        var i = 0,
            sweeper,
            max = this.numSweepers;

        if (this.ticks++ < this.params.numTicks) {
          for (; i < max; i++) {
            sweeper = this.hive.collection[i];
            sweeper.move(this.mines, this.hive.collection);
          }
        } else {
          this.beginNewDay();
        }

        return this;
      },

      beginNewDay: function() {
        this.hive.calcStats();
        this.avgMinesHistory.push(this.avgMines = this.hive.avgRewards);
        this.bestMinesHistory.push(this.bestMines = this.hive.bestRewards);

        this.hive
          .learn()
          .resetStats();

        this.day++;
        this.ticks = 0;

        return this;
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
    numSweepers: 0,
    numMines: 0,
    numTicks: 0,
    crossoverRate: 0,
    mutationRate: 0,
    maxPerturbation: 0,
    eliteCount: 5
  };

  return Controller;
}(smartSweepers));