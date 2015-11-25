idea.Heuristic = (function() {

  function swap(array, x, y) {
    if(x > array.length || y > array.length || x === y) {
      return;
    }
    var tem = array[x];
    array[x] = array[y];
    array[y] = tem;
  }

  function Heuristic(settings) {
    settings = settings || {};
    var _settings = {},
      defaults = Heuristic.defaults,
      i;

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }

    this.settings = _settings;
    this.rewards = 0;
    this.swapCount = 0;
    this.exchangeCount = 0;
  }

  Heuristic.prototype = {

    think: function() {
      return this.reward(this.settings.goal(this));
    },
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
      var settings = this.settings,
          copy = new Heuristic({
            sequence: settings.sequence.slice(0),
            reward: settings.reward
          });

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
          settings = this.settings,
          sequence = settings.sequence.slice(0),
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

      this.settings.sense(sequence);
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
          settings = this.settings,
          sequence = settings.sequence.slice(0);

      do {
        m = Math.floor(Math.random() * (sequence.length >> 1));
        n = Math.floor(Math.random() * sequence.length);
      } while (m >= n);

      var s1 = sequence.slice(0, m),
          s2 = sequence.slice(m, n),
          s3 = sequence.slice(n, sequence.length);

      settings.sense(
        s2
          .concat(s1)
          .concat(s3)
      );

      return this;
    }
  };

  Heuristic.defaults = {
    sequence: [],
    goal: null,
    sense: function(newSequence) {
      this.settings.sequence = newSequence;
    }
  };

  return Heuristic;
})();
