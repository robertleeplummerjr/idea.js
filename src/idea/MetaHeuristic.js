/**
 * meta heuristic / genetic algorithm
 */
idea.MetaHeuristic = (function() {
  function clone(array) {
    return array.slice(0);
  }

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
    this.mutationTimes = 0;
    this.thinkCount = 0;
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
    think: function () {
      this.thinkCount++;
      return this
        .optimize()
        .learn()
        .morph()
        .improve();
    },
    optimize: function () {
      var parents = [],
        i = 4,
        max = this.settings.count,
        heuristics = this.heuristics,
        best = this.bestValue,
        bestClone = best.clone();

      parents.push(heuristics[this.bestPosition]);
      parents.push(bestClone.mutate());
      parents.push(bestClone.pushMutate());
      parents.push(bestClone);

      this.sort();
      for(; i < max; i++) {
        parents.push(this.pickGoodHeuristic());
      }
      this.heuristics = parents;

      return this;
    },
    learn: function () {
      var queue = [],
        i = 0,
        settings = this.settings,
        max = settings.count,
        learnProbability = settings.learnProbability,
        j;

      for(; i < max; i++) {
        if(Math.random() < learnProbability) {
          queue.push(i);
        }
      }

      shuffle(queue);

      for(i = 0, j = queue.length - 1; i < j; i += 2) {
        this.crossover(queue[i], queue[i+1]);
      }

      return this;
    },
    crossover: function (x, y) {
      var heuristics = this.heuristics;
      heuristics[x] = this.getNextChild(x, y);
      heuristics[y] = this.getPreviousChild(x, y);
      return this;
    },
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
    getPreviousChild: function (fun, x, y) {
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
    morph: function () {
      var heuristics = this.heuristics,
        settings = this.settings,
        mutationProbability = settings.mutationProbability,
        max = settings.count,
        i = 0;

      for(; i < max; i++) {
        if(Math.random() < mutationProbability) {
          if(Math.random() > 0.5) {
            heuristics[i].pushMutate();
          } else {
            heuristics[i].mutate();
          }
          i--;
        }
      }

      return this;
    },
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
    sort: function () {
      var heuristics = this.heuristics;

      heuristics.sort(function(a, b) {
        return a.rewards - b.rewards;
      });

      return this;
    },
    pickGoodHeuristic: function () {
      var middleIndex = Math.floor(this.settings.count / 2),
        indexBetweenMiddleAndHigh = Math.floor((Math.random() * middleIndex) + middleIndex);

      return this.heuristics[indexBetweenMiddleAndHigh];
    },
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
    learnProbability: 0.9,
    mutationProbability: 0.01,
    possibilities: [],
    goal: null
  };

  return MetaHeuristic;
})();