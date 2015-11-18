/**
 * meta heuristic / genetic algorithm
 */
idea.MH = idea.MetaHeuristic = (function() {
  function clone(array) {
    return array.slice(0);
  }

  function shuffle(array) {
    var j,
      x,
      i = array.length - 1;

    while (i) {
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

  function swap(array, x, y) {
    if(x > array.length || y > array.length || x === y) {
      return;
    }
    var tem = array[x];
    array[x] = array[y];
    array[y] = tem;
  }

  function MH(settings) {
    settings = settings || {};

    var defaults = MH.defaults,
      _settings = {},
      i;

    this.heuristics = [];
    this.fitnessValues = [];
    this.roulette = [];
    this.mutationTimes = 0;
    this.thinkCount = 0;
    this.values = [];
    this.improvements = 0;
    this.bestPosition = null;
    this.bestValue = null;

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }
    this.settings = settings = _settings;

    for(i = 0; i < settings.count; i++) {
      this.heuristics.push(this.randomPossibility());
    }

    this.improve();
  }

  MH.prototype = {
    think: function () {
      this.thinkCount++;
      return this
        .selection()
        .learn()
        .morph()
        .improve();
    },
    selection: function () {
      var parents = [],
        i = 4,
        max = this.settings.count,
        heuristics = this.heuristics,
        best = this.bestValue,
        bestClone = clone(best);

      parents.push(heuristics[this.bestPosition]);
      parents.push(this.mutate(bestClone));
      parents.push(this.pushMutate(bestClone));
      parents.push(bestClone);

      this.loadRoulette();
      for(; i < max; i++) {
        parents.push(heuristics[this.wheelOut()]);
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
        c = dx.rewards < dy.rewards ? dx : dy;
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
        c = dx.rewards < dy.rewards ? dx : dy;
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
            heuristics[i] = this.pushMutate(heuristics[i]);
          } else {
            heuristics[i] = this.mutate(heuristics[i]);
          }
          i--;
        }
      }

      return this;
    },
    mutate: function (sequence) {
      this.mutationTimes++;
      var m,
        n,
        i = 0,
        j;
      // m and n refers to the actual index in the array
      // m range from 0 to length-2, n range from 2...length-m
      do {
        m = Math.random() * (sequence.length - 2);
        n = Math.random() * sequence.length;
      } while (m>=n);

      for(j= (n - m + 1) >> 1; i < j; i++) {
        swap(sequence, m + i, n - i);
      }

      return sequence;
    },
    pushMutate: function (sequence) {
      this.mutationTimes++;
      var m,n;
      do {
        m = Math.random() * (sequence.length>>1);
        n = Math.random() * sequence.length;
      } while (m >= n);

      var s1 = sequence.slice(0, m),
        s2 = sequence.slice(m, n),
        s3 = sequence.slice(n, sequence.length);

      return clone(
        s2
          .concat(s1)
          .concat(s3)
      );
    },
    improve: function () {
      var i = 0,
        heuristics = this.heuristics,
        max = heuristics.length,
        values = this.values,
        value,
        currentBestValue = values[0],
        heuristic,
        settings = this.settings;

      for(; i < max; i++) {
        heuristic = heuristics[i];
        values[i] = value = settings.goal(heuristic);

        if(value < currentBestValue) {
          currentBestValue = value;
          this.improvements++;
        }
      }

      return this;
    },
    loadRoulette: function () {
      var i = 0,
        settings = this.settings,
        max = settings.count,
        values = this.values,
        fitnessValues = this.fitnessValues,
        roulette = this.roulette,
        sum = 0;

      //calculate all the fitness
      for(; i < max; i++) {
        fitnessValues[i] = 1 / values[i];
      }
      //set the roulette
      for(i = 0; i < max; i++) {
        sum += fitnessValues[i];
      }
      for(i = 0; i < max; i++) {
        roulette[i] = fitnessValues[i] / sum;
      }
      for(i = 1; i < max; i++) {
        roulette[i] += roulette[i - 1];
      }

      return this;
    },
    wheelOut: function () {
      var i,
        rand = Math.random(),
        roulette = this.roulette,
        max = roulette.length;

      for(i = 0; i < max; i++) {
        if(rand <= roulette[i] ) {
          return i;
        }
      }

      return -1;
    },
    randomPossibility: function () {
      var array = [],
        settings = this.settings,
        possibilities = settings.possibilities,
        count = possibilities.length,
        i = 0;

      for(; i < count; i++) {
        array.push(new idea.Heuristic(possibilities[i]));
      }

      return shuffle(array);
    }
  };

  MH.defaults = {
    count: 30,
    learnProbability: 0.9,
    mutationProbability: 0.01,
    possibilities: [],
    sense: null,
    goal: null,
    action: null
  };

  return MH;
})();