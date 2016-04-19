'use strict';

function randomClamped() {
  return Math.random() - Math.random();
}

function Neuron(inputCount) {
  this.weights = [];

  for (var i = 0; i <= inputCount; i++) {
    // Create random weight between -1 and 1
    this.weights.push(randomClamped());
  }
}

module.exports = Neuron;