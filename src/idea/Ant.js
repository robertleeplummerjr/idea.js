idea.Ant = (function(visited, current, path) {
  function Ant() {
    this.visited = visited || [];
    this.current = current || null;
    this.path = path || [];
  }

  Ant.prototype = {

  };

  return Ant;
})();