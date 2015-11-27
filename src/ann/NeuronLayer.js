ann.NeuronLayer = (function(ann) {
  "use strict";

  function NeuronLayer(neuronCount, inputCount) {
    this.neurons = [];
    for (var i = 0; i < neuronCount; i++) {
      this.neurons.push(new ann.Neuron(inputCount));
    }
  }

  return NeuronLayer;
})(ann);