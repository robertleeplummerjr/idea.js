idea.AntTrail = (function() {
  function AntTrail(from, to, probability) {
    this.from = from;
    this.to = to;
    this.probability = probability;
  }

  AntTrail.prototype = {};

  return AntTrail;
})();