idea.Heuristic = (function() {

  function swap(array, x, y) {
    if(x > array.length || y > array.length || x === y) {
      return;
    }
    var tem = array[x];
    array[x] = array[y];
    array[y] = tem;
  }

  function Heuristic(sequence) {
    this.rewards = 0;
    this.sequence = sequence;
    this.swapCount = 0;
    this.exchangeCount = 0;
  }

  Heuristic.prototype = {
    /**
     *
     * @param {number} reward
     * @returns {Heuristic}
     */
    reward: function(reward) {
      reward = (reward === undefined ? 1 : reward);
      this.rewards += reward;
      return this;
    },

    /**
     *
     * @returns {Heuristic}
     */
    clone: function() {
      var sequence = this.sequence,
          copy = new Heuristic(sequence.slice(0));
      copy.rewards = this.rewards;

      return copy;
    },

    /**
     *
     * @returns {Heuristic}
     */
    swap: function () {
      this.swapCount++;
      var m,
          sequence = this.sequence,
          n,
          i = 0,
          j;
      // m and n refers to the actual index in the array
      // m range from 0 to length-2, n range from 2...length-m
      do {
        m = Math.random() * (sequence.length - 2);
        n = Math.random() * sequence.length;
      } while (m >= n);

      for(j = (n - m + 1) >> 1; i < j; i++) {
        swap(sequence, m + i, n - i);
      }

      this.sequence = sequence;
      return this;
    },

    /**
     *
     * @returns {Heuristic}
     */
    exchange: function () {
      this.exchangeCount++;
      var m,
          n,
          sequence = this.sequence;

      do {
        m = Math.random() * (sequence.length >> 1);
        n = Math.random() * sequence.length;
      } while (m >= n);

      var s1 = sequence.slice(0, m),
          s2 = sequence.slice(m, n),
          s3 = sequence.slice(n, sequence.length);

      this.sequence = s2
          .concat(s1)
          .concat(s3);

      return this;
    }
  };

  return Heuristic;
})();
