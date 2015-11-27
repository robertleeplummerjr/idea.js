ann.Hive = (function(ann) {
  "use strict";

  /**
   *
   * @param {Object} settings
   * @constructor
   */
  function Hive(settings) {
    var defaults = Hive.defaults,
        i,
        collection = this.collection = [],
        _settings = {};

    settings = settings || {};
    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }

    this.learnCount = 0;
    this.settings = settings = _settings;
    this.totalRewards = 0;
    this.bestRewards = 0;
    this.avgRewards = 0;
    this.lowestRewards = Hive.defaults.worstRewards;
    this.bestWisdom = null;
    this.elites = [];
    this.nonElites = [];

    for (i = 0; i < settings.count; i++) {
      collection.push(settings.initType());
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
          studentWisdom = new ann.Wisdom([], this.settings.maxPerturbation),
          teacherWisdom = teacher.brain.wisdom,
          weights = teacher.brain.wisdom.weights,
          crossoverPoint,
          max = weights.length;

      if (Math.random() > this.settings.crossoverRate) {
        for (; i < max; i++) {
          studentWisdom.weights[i] = teacherWisdom.weights[i];
        }
      } else {
        // Pick a crossover point.
        crossoverPoint = Math.floor((Math.random() * (this.settings.weightCount - 1)));

        // Swap weights
        for (; i < crossoverPoint; i++) {
          studentWisdom.weights[i] = teacherWisdom.weights[i];
        }

        for (i = crossoverPoint; i < max; i++) {
          studentWisdom.weights[i] = teacherWisdom.weights[i];
        }
      }

      studentWisdom.hypothesize(this.settings.mutationRate);
      student.brain.wisdom = studentWisdom;
      student.brain.putWeights();

      return this;
    },

    // Maybe switch this out with Tournament selection?
    /**
     *
     * @returns {ann.Wisdom}
     */
    select: function() {
      var slice = Math.random() * this.totalRewards,
          settings = this.settings,
          item,
          chosen = null,
          currentRewards = 0,
          max = settings.count,
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
     * @param {boolean} [resetRewards]
     * @returns {Hive}
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
          item.brain.wisdom.rewards = 0;
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
     * @returns {Hive}
     */
    calcStats: function() {
      this.sort();
      this.totalRewards = 0;
      var bestRewards = 0,
          settings = this.settings,
          rewards,
          wisdom,
          item,
          max = settings.count,
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

      this.avgRewards = this.totalRewards / this.settings.count;
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
      this.settings.sort.call(this, this.collection);
      return this;
    },
    learn: function() {
      this.learnCount++;
      this
          .calcStats()
          .setElites();

      var elites = this.elites,
          elite,
          nonElites = this.nonElites,
          nonElite,
          max = nonElites.length,
          i = 0;

      for (; i < max; i++) {
        elite = elites.length > 0 ? elites[Math.floor(Math.random() * (elites.length - 1))] : this.select();
        nonElite = nonElites[i];
        this.teach(elite, nonElite);
      }

      return this;
    },

    /**
     *
     * @param {Function} [each]
     * @returns {Hive}
     */
    live: function(each) {
      var collection = this.collection,
          max = collection.length,
          item,
          i = 0;

      if (each === undefined) {
        for (; i < max; i++) {
          item = collection[i];
          item.brain.think();
        }
      } else {
        for (; i < max; i++) {
          item = collection[i];
          item.brain.think();
          each.call(this, item, i);
        }
      }

      return this;
    }
  };

  Hive.defaults = {
    initType: function() {
      return null;
    },
    sort: function() {
      this.collection.sort(function(a, b) {
        if (a.brain.wisdom.rewards > b.brain.wisdom.rewards) {
          return 1;
        } else if (a.brain.wisdom.rewards < b.brain.wisdom.rewards) {
          return -1;
        } else {
          return 0;
        }
      });
    },
    worstRewards: 9999999,
    count: 30,
    mutationRate: 0.1,
    crossoverRate: 0.7,
    weightCount: 0,
    maxPerturbation: 0.3,
    eliteCount: 5,
    eliteCopiesCount: 1
  };

  return Hive;
})(ann);