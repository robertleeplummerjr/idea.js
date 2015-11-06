(function(brain) {
	"use strict";
	function NeuronLayer(neuronCount, inputCount) {
		this.neurons = [];
		for (var i = 0; i < neuronCount; i++) {
			this.neurons.push(new brain.Neuron(inputCount));
		}
	}

	brain.NeuronLayer = NeuronLayer;
})(brain);