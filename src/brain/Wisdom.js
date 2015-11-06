(function(brain) {
  "use strict";

  /**
   *
   * @param {number[]} weights
   * @param {number} maxPerturbation
   * @param {number} [fitness]
   * @constructor
   */
  function Wisdom(weights, maxPerturbation, fitness) {
    this.weights = weights;
    this.maxPerturbation = maxPerturbation;
    this.fitness = fitness || 0;
  }

  Wisdom.prototype = {
    /**
     *
     * @returns {Wisdom}
     */
    hypothesize: function() {
      var i = 0,
          max = this.weights.length;

      for (; i < max; i++) {
        if (Math.random() < this.mutationRate) {
          this.weights[i] += (Math.random() - Math.random()) * this.maxPerturbation;
        }
      }
      return this;
    },
    clone: function() {
      return new brain.Wisdom(this.weights.slice(0), this.maxPerturbation, this.fitness);
    }
  };

  brain.Wisdom = Wisdom;
})(brain);