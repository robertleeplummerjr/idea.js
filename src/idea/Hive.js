idea.Hive = (function(idea) {
  "use strict";

  function randomResult(array) {
    return array[Math.floor(Math.random() * (array.length - 1))];
  }
  /**
   *
   * @param {function} initType
   * @param {number} count
   * @param {number} mutationRate
   * @param {number} crossoverRate
   * @param {number} weightCount
   * @param {number} maxPerturbation
   * @param {number} eliteCount
   * @param {number} eliteCopiesCount
   * @constructor
   */
  function Hive(initType, count, mutationRate, crossoverRate, weightCount, maxPerturbation, eliteCount, eliteCopiesCount) {
    this.initType = initType;
    this.count = count;
    this.weightCount = weightCount;
    this.mutationRate = mutationRate;
    this.maxPerturbation = maxPerturbation;
    this.eliteCount = eliteCount;
    this.eliteCopiesCount = eliteCopiesCount;
    this.crossoverRate = crossoverRate;
    this.totalRewards = 0;
    this.bestRewards = 0;
    this.avgRewards = 0;
    this.lowestRewards = Hive.defaults.worstRewards;
    this.bestWisdom = null;
    this.elites = null;
    this.nonElites = null;

    var i,
        collection = this.collection = [];

    for (i = 0; i < count; i++) {
      collection.push(initType());
    }
  }

  Hive.prototype = {
    /**
     *
     * @param {*} teacher
     * @param {*} student
     * @returns {Hive}
     */
    teach: function(teacher, student) {
      var i = 0,
          studentWisdom = new idea.Wisdom([], this.maxPerturbation),
          teacherWisdom = teacher.brain.wisdom,
          weights = teacher.brain.wisdom.weights,
          crossoverPoint,
          max = weights.length;

      if (Math.random() > this.crossoverRate) {
        for (; i < max; i++) {
          studentWisdom.weights[i] = teacherWisdom.weights[i];
        }
      } else {
        // Pick a crossover point.
        crossoverPoint = Math.floor((Math.random() * (this.weightCount - 1)));

        // Swap weights
        for (; i < crossoverPoint; i++) {
          studentWisdom.weights[i] = teacherWisdom.weights[i];
        }

        for (i = crossoverPoint; i < max; i++) {
          studentWisdom.weights[i] = teacherWisdom.weights[i];
        }
      }

      studentWisdom.rewards = teacherWisdom.rewards;
      studentWisdom.hypothesize(this.mutationRate);
      student.brain.wisdom = studentWisdom;
      student.brain.putWeights();

      return this;
    },

    // Maybe switch this out with Tournament selection?
    /**
     *
     * @returns {idea.Wisdom}
     */
    select: function() {
      var slice = Math.random() * this.totalRewards,
          item,
          chosen = null,
          currentRewards = 0,
          max = this.count,
          i = 0;

      // Keep adding rewards until it is above the slice,
      // then we stop and take the current wisdom
      for (; i < max; i++) {
        item = this.collection[i];
        currentRewards += item.brain.wisdom.rewards;
        if (currentRewards >= slice) {
          chosen = item;
          break;
        }
      }
      return chosen;
    },

    /**
     *
     * @param {number} [eliteCount]
     * @returns {*}
     */
    setElites: function(eliteCount) {
      eliteCount = eliteCount || this.eliteCount;

      var item,
          collection = this.collection,
          elites = this.elites = [],
          nonElites = this.nonElites = [],
          i = 0,
          max = this.count;

      for (;i < max;i++) {
        item = collection[i];
        item.brain.wisdom.rewards = 0;
        if (i < eliteCount) {
          elites.push(item);
        } else {
          nonElites.push(item);
        }
      }

      return this;
    },

    /**
     *
     * @returns {Hive}
     */
    calcStats: function() {
      this.totalRewards = 0;
      var bestRewards = 0,
          rewards,
          wisdom,
          item,
          max = this.count,
          lowestRewards = this.lowestRewards,
          i = 0;

      for (; i < max; i++) {
        item = this.collection[i];
        wisdom = item.brain.wisdom;
        rewards = wisdom.rewards;
        if (rewards > bestRewards) {
          bestRewards = rewards;
          this.bestRewards = bestRewards;
          this.bestWisdom = wisdom;
        }

        if (rewards < lowestRewards) {
          lowestRewards = rewards;
          this.lowestRewards = lowestRewards;
        }
        this.totalRewards += rewards;
      }

      this.avgRewards = this.totalRewards / this.count;
      return this;
    },
    resetStats: function() {
      this.totalRewards = 0;
      this.bestRewards = 0;
      this.lowestRewards = Hive.defaults.worstRewards;
      this.avgRewards = 0;

      return this;
    },
    sort: function() {
      this.collection.sort(function(a, b) {
        if (a.brain.rewards > b.brain.rewards) {
          return 1;
        } else if (a.brain.rewards < b.brain.rewards) {
          return -1;
        } else {
          return 0;
        }
      });

      return this;
    },
    learn: function() {
      this
          .sort()
          .calcStats()
          .setElites();

      var elites = this.elites,
          elite,
          nonElites = this.nonElites,
          nonElite,
          max = nonElites.length,
          i = 0;

      for (; i < max; i++) {
        elite = randomResult(elites) || this.select();
        nonElite = nonElites[i];
        this.teach(elite, nonElite);
      }

      return this;
    }
  };

  Hive.defaults = {
    worstRewards: 9999999
  };

  return Hive;
})(idea);