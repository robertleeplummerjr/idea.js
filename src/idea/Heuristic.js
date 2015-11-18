idea.Heuristic = (function() {
  function Heuristic(item) {
    this.rewards = 0;
    this.item = item;
  }

  Heuristic.prototype = {
    reward: function() {
      this.rewards++;
      return this;
    },
    clone: function() {
      var item = this.item,
          copy = new Heuristic(item);
      copy.rewards = this.rewards;

      return copy;
    }
  };

  return Heuristic;
})();
