idea.NeuronLayer = (function(idea) {
  "use strict";

  function NeuronLayer(neuronCount, inputCount) {
    this.neurons = [];
    for (var i = 0; i < neuronCount; i++) {
      this.neurons.push(new idea.Neuron(inputCount));
    }
  }

  return NeuronLayer;
})(idea);