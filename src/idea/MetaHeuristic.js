/**
 * meta heuristic / genetic algorithm
 */
idea.MetaHeuristic = (function() {
  function nextIn(array, index) {
    index++;
    if(index >= array.length) {
      index = 0;
    }

    return array[index];
  }

  function prevIn(array, index) {
    index--;
    if(index < 0) {
      index = array.length - 1;
    }

    return array[index];
  }

  function deleteByValue(array, value) {
    var pos = array.indexOf(value);
    array.splice(pos, 1);
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

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }

    this.settings = _settings;

    for (i = 0; i < settings.count; i++) {
      collection.push(settings.initType());
    }

    this.learn();
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
        student = collection[backward ? y : x],
        leftSequence = collection[x].heuristic.settings.sequence.slice(0),
        left,
        rightSequence = collection[y].heuristic.settings.sequence.slice(0),
        right,
        sequence = [],
        randomIndex = Math.floor(Math.random() * (leftSequence.length - 1)),
        current,
        navigate = backward ? prevIn : nextIn;

      //a random starting point found in both left and right sequences
      current = leftSequence[randomIndex];
      sequence.push(current);
      while(leftSequence.length > 1) {
        left = navigate(leftSequence, leftSequence.indexOf(current));
        right = navigate(rightSequence, rightSequence.indexOf(current));
        deleteByValue(leftSequence, current);
        deleteByValue(rightSequence, current);
        current = filter(left, right, current);
        sequence.push(current);
      }

      if (student.heuristic.settings.sense !== null) {
        student.heuristic.settings.sense(sequence);
      }

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
      this.settings.sort.call(this, this.collection);
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
    filter: null,
    sort: function () {
      this.collection.sort(function(a, b) {
        return a.heuristic.rewards - b.heuristic.rewards;
      });
    }
  };

  return MetaHeuristic;
})();