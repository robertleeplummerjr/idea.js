/**
 * meta heuristic / genetic algorithm
 */
idea.MetaHeuristic = (function() {
  function shuffle(array) {
    var j,
        x,
        i = array.length - 1;

    while (i > -1) {
      j = Math.random() * i;
      x = array[--i];
      array[i] = array[j];
      array[j] = x;
    }

    return this;
  }

  function next(array, index) {
    if(index === array.length-1) {
      return array[0];
    }

    return array[index + 1];
  }

  function previous(array, index) {
    if(index === 0) {
      return array[array.length - 1];
    }
    return array[index - 1];
  }

  function MetaHeuristic(settings) {
    settings = settings || {};

    var defaults = MetaHeuristic.defaults,
        _settings = {},
        i;

    this.heuristics = [];
    this.learnCount = 0;
    this.improvements = 0;
    this.bestPosition = null;
    this.bestValue = null;

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }
    this.settings = _settings;

    this
        .generateHeuristics()
        .improve();
  }

  MetaHeuristic.prototype = {
    /**
     *
     * @returns {MetaHeuristic}
     */
    learn: function () {
      this.learnCount++;
      return this
        .calcStats()
        .optimize()
        .teach()
        .mutate()
        .improve();
    },

    /**
     *
     * @returns {MetaHeuristic}
     */
    calcStats: function() {

      return this;
    },

    /**
     *
     * @returns {MetaHeuristic}
     */
    optimize: function () {
      var parents = [],
          i = 4,
          max = this.settings.count,
          heuristics = this.heuristics,
          best = this.bestValue,
          bestClone = best.clone();

      this.sort();

      parents.push(heuristics[this.bestPosition]);
      parents.push(bestClone.swap());
      parents.push(bestClone.exchange());
      parents.push(bestClone);

      for(; i < max; i++) {
        parents.push(this.pickGoodHeuristic());
      }
      this.heuristics = parents;

      return this;
    },

    /**
     *
     * @returns {MetaHeuristic}
     */
    teach: function () {
      var queue = [],
          i = 0,
          settings = this.settings,
          max = settings.count,
          maxPerturbation = settings.maxPerturbation,
          j;

      for(; i < max; i++) {
        if(Math.random() < maxPerturbation) {
          queue.push(i);
        }
      }

      shuffle(queue);

      for(i = 0, j = queue.length - 1; i < j; i += 2) {
        this.crossover(queue[i], queue[i+1]);
      }

      return this;
    },

    /**
     *
     * @param x
     * @param y
     * @returns {MetaHeuristic}
     */
    crossover: function (x, y) {
      var heuristics = this.heuristics;
      heuristics[x] = this.getNextChild(x, y);
      heuristics[y] = this.getPreviousChild(x, y);
      return this;
    },

    /**
     *
     * @param x
     * @param y
     * @returns {Array}
     */
    getNextChild: function (x, y) {
      var solution = [],
          heuristics = this.heuristics,
          px = heuristics[x].clone(),
          py = heuristics[y].clone(),
          xi,
          yi,
          dx,
          dy,
          i = Math.random() * px.length,
          c = px[i];

      solution.push(c);

      while(px.length > 1) {
        xi = i;
        yi = py.indexOf(c);
        dx = next(px, xi);
        dy = next(py, yi);
        px.splice(xi, 1);
        py.splice(yi, 1);
        c = dx.rewards > dy.rewards ? dx : dy;
        solution.push(c);
      }

      return solution;
    },

    /**
     *
     * @param x
     * @param y
     * @returns {Array}
     */
    getPreviousChild: function (x, y) {
      var solution = [],
          heuristics = this.heuristics,
          px = heuristics[x].clone(),
          py = heuristics[y].clone(),
          xi,
          yi,
          dx,
          dy,
          i = Math.random() * px.length,
          c = px[i];

      solution.push(c);

      while(px.length > 1) {
        xi = i;
        yi = py.indexOf(c);
        dx = previous(px, xi);
        dy = previous(py, yi);
        px.splice(xi, 1);
        py.splice(yi, 1);
        c = dx.rewards > dy.rewards ? dx : dy;
        solution.push(c);
      }

      return solution;
    },

    /**
     *
     * @returns {MetaHeuristic}
     */
    mutate: function () {
      var heuristics = this.heuristics,
          settings = this.settings,
          mutationProbability = settings.mutationProbability,
          max = settings.count,
          i = 0;

      for(; i < max; i++) {
        if(Math.random() < mutationProbability) {
          if(Math.random() > 0.5) {
            heuristics[i].exchange();
          } else {
            heuristics[i].swap();
          }
          i--;
        }
      }

      return this;
    },

    /**
     *
     * @returns {MetaHeuristic}
     */
    improve: function () {
      var i = 0,
          heuristics = this.heuristics,
          max = heuristics.length,
          currentBestValue = heuristics[0].rewards,
          heuristic,
          settings = this.settings;

      for(; i < max; i++) {
        heuristic = heuristics[i];
        heuristic.reward(settings.goal(heuristic));

        if(heuristic.rewards < currentBestValue) {
          this.bestPosition = i;
          this.bestValue = currentBestValue = heuristic.rewards;
          this.improvements++;
        }
      }

      return this;
    },

    /**
     *
     * @returns {MetaHeuristic}
     */
    sort: function () {
      var heuristics = this.heuristics;

      heuristics.sort(function(a, b) {
        return a.rewards - b.rewards;
      });

      return this;
    },

    /**
     *
     * @returns {Heuristic}
     */
    pickGoodHeuristic: function () {
      var middleIndex = Math.floor(this.settings.count / 2),
        indexBetweenMiddleAndHigh = Math.floor((Math.random() * middleIndex) + middleIndex);

      return this.heuristics[indexBetweenMiddleAndHigh];
    },

    /**
     *
     * @returns {MetaHeuristic}
     */
    generateHeuristics: function () {
      var settings = this.settings,
          possibilities = settings.possibilities,
          heuristic,
          heuristics = this.heuristics,
          count = settings.count,
          i = 0;

      for(; i < count; i++) {
        heuristic = new idea.Heuristic(possibilities);
        shuffle(heuristic.items);
        heuristics.push(heuristic);
      }
      return this;
    }
  };

  MetaHeuristic.defaults = {
    count: 30,
    maxPerturbation: 0.9,
    mutationProbability: 0.01,
    possibilities: [],
    goal: null
  };

  return MetaHeuristic;
})();