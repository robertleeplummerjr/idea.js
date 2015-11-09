brain.Hive = (function(brain) {
  "use strict";

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

    var i,
        collection = this.collection = [];

    for (i = 0; i < count; i++) {
      collection.push(initType());
    }
  }

  Hive.prototype = {
    /**
     *
     * @param {brain.Wisdom} existing1
     * @param {brain.Wisdom} existing2
     * @param {brain.Wisdom} new1
     * @param {brain.Wisdom} new2
     * @returns {Hive}
     */
    transferWisdom: function(existing1, existing2, new1, new2) {
      var i,
          crossoverPoint;

      if (Math.random() > this.crossoverRate) {
        for (i = 0; i < existing1.weights.length; i++) {
          new1.weights[i] = existing1.weights[i];
          new2.weights[i] = existing2.weights[i];
        }
        new1.rewards = existing1.rewards;
        new2.rewards = existing2.rewards;
      } else {
        // Pick a crossover point.
        crossoverPoint = Math.floor((Math.random() * (this.weightCount - 1)));

        // Swap weights
        for (i = 0; i < crossoverPoint; i++) {
          new1.weights[i] = existing1.weights[i];
          new2.weights[i] = existing2.weights[i];
        }

        for (i = crossoverPoint; i < existing1.weights.length; i++) {
          new1.weights[i] = existing1.weights[i];
          new2.weights[i] = existing2.weights[i];
        }
      }

      new1.rewards = existing1.rewards;
      new2.rewards = existing2.rewards;

      return this;
    },

    // Maybe switch this out with Tournament selection?
    /**
     *
     * @returns {brain.Wisdom}
     */
    select: function() {
      var slice = Math.random() * this.totalRewards,
          item,
          chosen = null,
          currentRewards = 0,
          i = 0;

      // Keep adding rewards until it is above the slice,
      // then we stop and take the current wisdom
      for (; i < this.count; i++) {
        item = this.collection[i];
        currentRewards += item.wisdom.rewards;
        if (currentRewards >= slice) {
          chosen = item;
          break;
        }
      }
      return chosen;
    },

    /**
     *
     * @param {number} [bestCount]
     * @param {number} [copiesCount]
     * @returns {*}
     */
    getElites: function(bestCount, copiesCount) {
      bestCount = bestCount || this.eliteCount;
      copiesCount = copiesCount || this.eliteCopiesCount;

      var best = [],
          i;
      while (bestCount--) {
        for (i = 0; i < copiesCount; i++) {
          best.push(this.collection[(this.count - 1) - bestCount]);
        }
      }
      return best;
    },

    /**
     *
     * @returns {Hive}
     */
    calcStats: function() {
      this.totalRewards = 0;
      var bestRewards = 0,
          rewards,
          lowestRewards = this.lowestRewards,
          i;

      for (i = 0; i < this.count; i++) {
        rewards = this.collection[i].wisdom.rewards;
        if (rewards > bestRewards) {
          bestRewards = rewards;
          this.bestRewards = bestRewards;
          this.bestWisdom = this.wisdoms[i];
        }

        if (this.wisdoms[i].rewards < lowestRewards) {
          lowestRewards = this.wisdoms[i].rewards;
          this.lowestRewards = lowestRewards;
        }
        this.totalRewards += this.wisdoms[i].rewards;
      }

      this.avgRewards = this.totalRewards / this.count;
      return this;
    },
    reset: function() {
      this.totalRewards = 0;
      this.bestRewards = 0;
      this.lowestRewards = Hive.defaults.worstRewards;
      this.avgRewards = 0;
      return this;
    },
    learn: function() {
      this
          .reset()
          .collection.sort(function(a, b) {
            if (a.brain.rewards > b.brain.rewards) {
              return 1;
            } else if (a.brain.rewards < b.brain.rewards) {
              return -1;
            } else {
              return 0;
            }
          });

      this.calcStats();
      var elites = this.getElites(),
          existing1,
          existing2,
          new1,
          new2;

      while (elites.length < this.count) {
        existing1 = this.select().wisdom;
        existing2 = this.select().wisdom;
        new1 = new brain.Wisdom([], this.maxPerturbation);
        new2 = new brain.Wisdom([], this.maxPerturbation);
        this.transferWisdom(existing1, existing2, new1, new2);
        new1.hypothesize();
        new2.hypothesize();

        elites.push(new1);
        elites.push(new2);
      }

      return this.collection = elites;
    }
  };

  Hive.defaults = {
    worstRewards: 9999999
  };

  return Hive;
})(brain);