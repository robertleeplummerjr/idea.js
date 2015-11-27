idea.Ant = (function(visited, current, path) {
  function Ant() {
    this.visited = visited || [];
    this.current = current || null;
    this.path = path || [];
  }

  Ant.prototype = {

  };

  Ant.defaults = {
    sequence: [],
    goal: null,
    sense: function(newSequence) {
      this.settings.sequence = newSequence;
    }
  };

  return Ant;
})();