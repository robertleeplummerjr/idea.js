var Controller = (function() {
  "use strict";

  function Controller(settings) {
    var key,
        i,
        defaults = Controller.defaults,
        self = this,
        _settings = {};

    settings = settings || {};

    for (key in defaults) if (defaults.hasOwnProperty(key)) {
      _settings[key] = settings.hasOwnProperty(key) ? settings[key] : defaults[key];
    }

    this.settings = settings = _settings;
    this.mines = [];

    // Keep Per day
    this.avgMinesHistory = [];
    this.avgMines = 0;

    // Keep Per days
    this.bestMinesHistory = [];
    this.bestMines = 0;

    this.ticks = 0;

    // Current day;
    this.day = 0;

    this.fastRender = false;
    this.viewPaths = false;


    this.hive = new idea.Hive({
        initType: function() {
          return new Sweeper({
            fieldWidth: settings.windowWidth,
            fieldHeight: settings.windowHeight,
            hit: function(mine) {
              var i = self.mines.indexOf(mine);
              self.mines[i] = new Mine(Math.random() * settings.windowWidth, Math.random() * settings.windowHeight);
            }
          });
      },
      count: settings.numSweepers
    });

    for (i = 0; i < settings.numMines; i++) {
      this.mines.push(new Mine(Math.random() * settings.windowWidth, Math.random() * settings.windowHeight));
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
        var settings = this.settings,
          ctx = settings.ctx;

        ctx.clearRect(0, 0, settings.windowWidth, settings.windowHeight);
        ctx.beginPath();
        ctx.rect(0, 0, settings.windowWidth, settings.windowHeight);
        ctx.fillStyle = 'rgb(32, 36, 45)';
        ctx.fill();

        return this;
      },
      drawMines: function() {
        var settings = this.settings,
            ctx = settings.ctx,
            i = 0,
            max = settings.numMines,
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
        var settings = this.settings,
            ctx = settings.ctx,
            i = 0,
            max = settings.numSweepers,
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
        var settings = this.settings,
            ctx = settings.ctx,
            i = 0,
            hive = this.hive,
            max = settings.numSweepers,
            sweeper,
            mine,
            closestSweeper;

        if (this.viewPaths) {
          //mines first
          ctx.beginPath();
          for (; i < max; i++) {
            sweeper = hive.collection[i];
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
          for (; i < max; i++) {
            sweeper = hive.collection[i];
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
            hive = this.hive,
            settings = this.settings,
            max = settings.numSweepers;

        if (this.ticks++ < settings.numTicks) {
          for (; i < max; i++) {
            sweeper = hive.collection[i];
            sweeper.move(this.mines, hive.collection);
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
    ctx: null,
    windowWidth: 400,
    windowHeight: 400,
    numSweepers: 30,
    numMines: 40,
    numTicks: 2000
  };

  return Controller;
}());