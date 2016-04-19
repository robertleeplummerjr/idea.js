'use strict';

var Neuron  = require('neuron');

function Synapses(neuronCount, inputCount) {
  this.neurons = [];
  for (var i = 0; i < neuronCount; i++) {
    this.neurons.push(new Neuron(inputCount));
  }
}

module.exports = Synapses;