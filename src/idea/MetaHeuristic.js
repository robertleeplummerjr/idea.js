/**
 * meta heuristic / genetic algorithm
 */
idea.MetaHeuristic = (function() {
  function nextOf(array, index) {
    index++;
    if(index >= array.length) {
      index = 0;
    }

    return index;
  }

  function previousOf(array, index) {
    index--;
    if(index < 0) {
      index = array.length - 1;
    }

    return index;
  }

  function MetaHeuristic(settings) {
    settings = settings || {};

    var defaults = MetaHeuristic.defaults,
      _settings = {},
      i,
      collection;

    this.collection = collection = [];
    this.learnCount = 0;
    this.totalRewards = 0;
    this.bestRewards = 0;
    this.avgRewards = 0;
    this.lowestRewards = MetaHeuristic.defaults.worstRewards;
    this.elites = [];
    this.nonElites = [];

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }

    this.settings = _settings;

    for (i = 0; i < settings.count; i++) {
      collection.push(settings.initType());
    }
  }

  MetaHeuristic.prototype = {
    /**
     *
     * @returns {MetaHeuristic}
     */
    learn: function () {
      this.learnCount++;
      this
        .calcStats()
        .setElites()
        .optimize();

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
        this
          .teach(queue[i], queue[i + 1])
          .teach(queue[i], queue[i + 1], true);
      }

      return this.mutate();
    },

    /**
     *
     * @returns {MetaHeuristic}
     */
    calcStats: function() {
      this.sort();
      this.totalRewards = 0;
      var bestRewards = 0,
        settings = this.settings,
        rewards,
        item,
        collection = this.collection,
        max = settings.count,
        lowestRewards = this.lowestRewards,
        i = 0;

      for (; i < max; i++) {
        item = collection[i];
        rewards = item.heuristic.rewards;
        if (rewards > bestRewards) {
          bestRewards = rewards;
          this.bestRewards = bestRewards;
        }

        if (rewards < lowestRewards) {
          lowestRewards = rewards;
          this.lowestRewards = lowestRewards;
        }
        this.totalRewards += rewards;
      }

      this.avgRewards = this.totalRewards / this.settings.count;
      return this;
    },

    /**
     *
     * @param {number} [eliteCount]
     * @param {boolean} [resetRewards]
     * @returns {MetaHeuristic}
     */
    setElites: function(eliteCount, resetRewards) {
      eliteCount = eliteCount || this.settings.eliteCount;
      resetRewards = resetRewards !== undefined ? resetRewards : true;

      var item,
        collection = this.collection,
        settings = this.settings,
        elites = this.elites = [],
        nonElites = this.nonElites = [],
        i = 0,
        max = settings.count,
        nonEliteCount = max - eliteCount;

      for (;i < max; i++) {
        item = collection[i];

        if (resetRewards) {
          item.heuristic.rewards = 0;
        }

        if (nonElites.length < nonEliteCount) {
          nonElites.push(item);
        } else {
          elites.push(item);
        }
      }

      elites.reverse();
      nonElites.reverse();

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
          collection = this.collection;

      collection[1].heuristic.swap();
      collection[2].heuristic.exchange();

      parents.push(collection[0]);
      parents.push(collection[1]);
      parents.push(collection[2]);
      parents.push(collection[3]);

      for(; i < max; i++) {
        parents.push(this.select());
      }
      this.collection = parents;

      return this;
    },

    /**
     *
     * @param x
     * @param y
     * @param {Boolean} [backward]
     * @returns {MetaHeuristic}
     */
    teach: function (x, y, backward) {
      var settings = this.settings,
        filter = settings.filter,
        collection = this.collection,
        leftSequence = collection[x].heuristic.settings.sequence.slice(0),
        leftI,
        rightSequence = collection[y].heuristic.settings.sequence.slice(0),
        rightI,
        sequence = [],
        randomIndex = Math.floor(Math.random() * (leftSequence.length - 1)),
        next,
        current,
        of = backward ? previousOf : nextOf;

      leftI = randomIndex;
      current = leftSequence[leftI];
      rightI = rightSequence.indexOf(current);

      while (leftSequence.length > 0) {
        leftI = of(leftSequence, leftI);
        rightI = of(rightSequence, rightI);
        next = filter(leftSequence[leftI], rightSequence[rightI], current);
        leftSequence.splice(leftI, 1);
        rightSequence.splice(rightI, 1);
        current = next;
        sequence.push(next);
      }

      collection[backward ? y : x].heuristic.settings.sequence = sequence;
      return this;
    },


    /**
     *
     * @returns {MetaHeuristic}
     */
    mutate: function () {
      var collection = this.collection,
          settings = this.settings,
          mutationProbability = settings.mutationProbability,
          max = settings.count,
          i = 0;

      for(; i < max; i++) {
        if(Math.random() < mutationProbability) {
          if(Math.random() > 0.5) {
            collection[i].heuristic.exchange();
          } else {
            collection[i].heuristic.swap();
          }
          i--;
        }
      }

      return this;
    },

    /**
     *
     * @param {Function} [each]
     * @returns {MetaHeuristic}
     */
    live: function (each) {
      var i = 0,
          collection = this.collection,
          max = collection.length,
          item;

      if (each === undefined) {
        for (; i < max; i++) {
          item = collection[i];
          item.heuristic.think();
        }
      } else {
        for (; i < max; i++) {
          item = collection[i];
          item.heuristic.think();
          each(item, i);
        }
      }
      return this;
    },

    /**
     *
     * @returns {MetaHeuristic}
     */
    sort: function () {
      var collection = this.collection;

      collection.sort(function(a, b) {
        return a.heuristic.rewards - b.heuristic.rewards;
      });

      return this;
    },

    /**
     *
     * @returns {*}
     */
    select: function () {
      var middleIndex = Math.floor(this.settings.count / 2),
        indexBetweenMiddleAndHigh = Math.floor((Math.random() * middleIndex) + middleIndex);

      return this.collection[indexBetweenMiddleAndHigh];
    }
  };

  MetaHeuristic.defaults = {
    count: 30,
    maxPerturbation: 0.9,
    mutationProbability: 0.01,
    worstRewards: 9999999,
    filter: null
  };

  return MetaHeuristic;
})();