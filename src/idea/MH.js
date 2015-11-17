/**
 * metaheuristic / genetic algorithm
 */
idea.MH = idea.MetaHeuristic = (function() {
  function clone(array) {
    return array.slice(0);
  }

  function shuffle(array) {
    var j,
      x,
      i = array.length - 1;

    while(i) {
      j = randomNumber(i);
      x = array[--i];
      array[i] = array[j];
      array[j] = x;
    }
    return this;
  }

  function deleteByValue(array, value) {
    var pos = array.indexOf(value);
    if (pos > -1) {
      array.splice(pos, 1);
    }
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
    if(x>array.length || y>array.length || x === y) {return}
    var tem = array[x];
    array[x] = array[y];
    array[y] = tem;
  }

  function randomNumber(boundary) {
    return parseInt(Math.random() * boundary);
  }

  function distance(p1, p2) {
    return euclidean(p1.x-p2.x, p1.y-p2.y);
  }

  function euclidean(dx, dy) {
    return Math.sqrt(dx * dx + dy * dy);
  }

  function MH(settings) {
    settings = settings || {};

    var defaults = MH.defaults,
      _settings = {},
      i;

    this.population = [];
    this.fitnessValues = [];
    this.roulette = [];
    this.mutationTimes = 0;
    this.currentGeneration = 0;
    this.values = [];
    this.unchangedGenerations = 0;
    this.bestPosition = null;
    this.bestValue = null;

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }
    this.settings = settings = _settings;
    this.distances = this.countDistances();

    for(i = 0; i<settings.count; i++) {
      this.population.push(this.randomIndividual(settings.collection.length));
    }

    this.optimise();
  }

  MH.prototype = {
    find: function () {
      this.currentGeneration++;
      return this
        .selection()
        .crossover()
        .morph()
        .optimise();
    },
    selection: function () {
      var parents = [],
        i = 4,
        max = this.settings.count,
        population = this.population,
        best = this.bestValue,
        bestClone = clone(best);

      parents.push(population[this.bestPosition]);
      parents.push(this.mutate(bestClone));
      parents.push(this.pushMutate(bestClone));
      parents.push(bestClone);

      this.setRoulette();
      for(; i < max; i++) {
        parents.push(population[this.wheelOut()]);
      }
      this.population = parents;

      return this;
    },
    crossover: function () {
      var queue = [],
        i = 0,
        settings = this.settings,
        max = settings.count,
        crossoverProbability = settings.crossoverProbability,
        j;

      for(; i < max; i++) {
        if(Math.random() < crossoverProbability) {
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
      var population = this.population;
      population[x] = this.getNextChild(x, y);
      population[y] = this.getPreviousChild(x, y);
      return this;
    },
    getNextChild: function (fun, x, y) {
      var solution = [],
        population = this.population,
        px = clone(population[x]),
        py = clone(population[y]),
        dx,
        dy,
        distances = this.distances,
        c = px[randomNumber(px.length)];

      solution.push(c);

      while(px.length > 1) {
        dx = next(px, px.indexOf(c));
        dy = next(py, py.indexOf(c));
        deleteByValue(px, c);
        deleteByValue(py, c);
        c = distances[c][dx] < distances[c][dy] ? dx : dy;
        solution.push(c);
      }

      return solution;
    },
    getPreviousChild: function (fun, x, y) {
      var solution = [],
        population = this.population,
        px = clone(population[x]),
        py = clone(population[y]),
        dx,
        dy,
        distances = this.distances,
        c = px[randomNumber(px.length)];

      solution.push(c);

      while(px.length > 1) {
        dx = previous(px, px.indexOf(c));
        dy = previous(py, py.indexOf(c));
        deleteByValue(px, c);
        deleteByValue(py, c);
        c = distances[c][dx] < distances[c][dy] ? dx : dy;
        solution.push(c);
      }

      return solution;
    },
    morph: function () {
      var population = this.population,
        settings = this.settings,
        mutationProbability = settings.mutationProbability,
        max = settings.count,
        i = 0;

      for(; i < max; i++) {
        if(Math.random() < mutationProbability) {
          if(Math.random() > 0.5) {
            population[i] = this.pushMutate(population[i]);
          } else {
            population[i] = this.mutate(population[i]);
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
        m = this.randomNumber(sequence.length - 2);
        n = this.randomNumber(sequence.length);
      } while (m>=n);

      for(j= (n - m + 1) >> 1; i < j; i++) {
        sequence.swap(m+i, n-i);
      }

      return sequence;
    },
    pushMutate: function (sequence) {
      this.mutationTimes++;
      var m,n;
      do {
        m = this.randomNumber(sequence.length>>1);
        n = this.randomNumber(sequence.length);
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
    optimise: function () {
      var i = 0,
        population = this.population,
        max = population.length,
        values = this.values,
        currentBestValue = values[0];

      for(; i < max; i++) {
        values[i] = this.evaluate(population[i]);
      }

      for(i = 1; i < max; i++) {
        if(values[i] < currentBestValue) {
          this.bestValue = values[i];
          this.bestPosition = i;
        }
      }

      this.bestValue = clone(this.bestValue);

      if(this.bestValue === null || this.bestValue > this.bestValue) {
        this.unchangedGenerations = 0;
      } else {
        this.unchangedGenerations++;
      }

      return this;
    },
    setRoulette: function () {
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
    randomIndividual: function (n) {
      var array = [],
        i = 0;

      for(; i < n; i++) {
        array.push(i);
      }

      return shuffle(array);
    },
    evaluate: function (indivial) {
      var distances = this.distances,
        sum = distances[indivial[0]][indivial[indivial.length - 1]],
        i = 1,
        max = indivial.length;

      for(; i < max; i++) {
        sum += distances[indivial[i]][indivial[i-1]];
      }

      return sum;
    },
    countDistances: function () {
      var settings = this.settings,
        measure = settings.measure,
        max = settings.collection.length,
        distances = [],
        i = 0,
        j;

      for(; i < max; i++) {
        distances[i] = [];
        for(j = 0; j < max; j++) {
          distances[i][j] = measure.call(this, i, j);
        }
      }

      return distances;
    }
  };

  MH.defaults = {
    count: 30,
    crossoverProbability: 0.9,
    mutationProbability: 0.01,
    collection: [],
    measure: function(l, r) {
      var settings = this.settings,
        collection = settings.collection;
      return Math.floor(distance(collection[l], collection[r]))
    }
  };

  return MH;
})();