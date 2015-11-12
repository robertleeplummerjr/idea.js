idea.Wisdom = (function(idea) {
  "use strict";

  /**
   *
   * @param {number[]} weights
   * @param {number} maxPerturbation
   * @param {number} [rewards]
   * @constructor
   */
  function Wisdom(weights, maxPerturbation, rewards) {
    this.weights = weights;
    this.maxPerturbation = maxPerturbation;
    this.rewards = rewards || 0;
  }

  Wisdom.prototype = {
    /**
     *
     * @returns {Wisdom}
     */
    hypothesize: function(mutationRate) {
      var i = 0,
          max = this.weights.length;

      for (; i < max; i++) {
        if (Math.random() < mutationRate) {
          this.weights[i] += (Math.random() - Math.random()) * this.maxPerturbation;
        }
      }
      return this;
    },
    reward: function() {
      this.rewards++;
      return this;
    }
  };

  return Wisdom;
})(idea);