(function(brain) {
  "use strict";

  Array.prototype.random = function() {
    return this[Math.floor(Math.random() * (this.length - 1))];
  };
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
    this.totalFitness = 0;
    this.bestFitness = 0;
    this.avgFitness = 0;
    this.lowestFitness = Hive.defaults.worstFitness;
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
        new1.fitness = existing1.fitness;
        new2.fitness = existing2.fitness;
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

      new1.fitness = existing1.fitness;
      new2.fitness = existing2.fitness;

      return this;
    },

    // Maybe switch this out with Tournament selection?
    /**
     *
     * @returns {brain.Wisdom}
     */
    select: function() {
      var slice = Math.random() * this.totalFitness,
          item,
          chosen = null,
          currentFitness = 0,
          i = 0;

      // Keep adding fitness until it is above the slice,
      // then we stop and take the current wisdom
      for (; i < this.count; i++) {
        item = this.collection[i];
        currentFitness += item.wisdom.fitness;
        if (currentFitness >= slice) {
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
      this.totalFitness = 0;
      var bestFitness = 0,
          fitness,
          lowestFitness = this.lowestFitness,
          i;

      for (i = 0; i < this.count; i++) {
        fitness = this.collection[i].wisdom.fitness;
        if (fitness > bestFitness) {
          bestFitness = fitness;
          this.bestFitness = bestFitness;
          this.bestWisdom = this.wisdoms[i];
        }

        if (this.wisdoms[i].fitness < lowestFitness) {
          lowestFitness = this.wisdoms[i].fitness;
          this.lowestFitness = lowestFitness;
        }
        this.totalFitness += this.wisdoms[i].fitness;
      }

      this.avgFitness = this.totalFitness / this.count;
      return this;
    },
    reset: function() {
      this.totalFitness = 0;
      this.bestFitness = 0;
      this.lowestFitness = Hive.defaults.worstFitness;
      this.avgFitness = 0;
      return this;
    },
    learn: function() {
      this
          .reset()
          .collection.sort(function(a, b) {
            if (a.brain.fitness > b.brain.fitness) {
              return 1;
            } else if (a.brain.fitness < b.brain.fitness) {
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
    worstFitness: 9999999
  };

  brain.Hive = Hive;
})(brain);