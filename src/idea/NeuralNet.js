idea.NeuralNet = (function(idea) {
  "use strict";

  /**
   * @param {Object} settings
   * @constructor
   */
  function NeuralNet(settings) {
    var defaults = NeuralNet.defaults,
        i,
        _settings = {};

    settings = settings || {};
    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }

    this.settings = _settings;
    this.layers = [];
    this.wisdom = null;

    this
        .createNet()
        .createWisdom();
  }

  NeuralNet.prototype = {
    /**
     * this method builds the a NN. The weights are all initially set to random values between -1 and 1
     * @returns {NeuralNet}
     */
    createNet: function() {
      var settings = this.settings,
          max = settings.hiddenLayerCount - 1,
          i = 0,
          layers = this.layers;

      //create the layers of the network
      if (settings.hiddenLayerCount > 0) {
        //create first hidden layer
        layers.push(new idea.NeuronLayer(settings.hiddenLayerNeuronCount, settings.inputCount));
        for (; i < max; i++) {
          layers.push(new idea.NeuronLayer(settings.hiddenLayerNeuronCount, settings.hiddenLayerNeuronCount));
        }

        //create output layer
        layers.push(new idea.NeuronLayer(settings.outputCount, settings.hiddenLayerNeuronCount));
      } else {
        //create output layer
        layers.push(new idea.NeuronLayer(settings.outputCount, settings.inputCount));
      }

      return this;
    },

    /**
     *
     * @returns {NeuralNet}
     */
    createWisdom: function() {
      var settings = this.settings,
          weights = [],
          i = 0,
          max = this.getNumWeights();

      for (; i < max; i++) {
        weights.push(Math.random() - Math.random());
      }

      this.wisdom = new idea.Wisdom(weights, settings.maxPerturbation);
      this.putWeights(weights);

      return this;
    },

    reward: function() {
      this.wisdom.reward();
      return this;
    },

    /**
     * returns weights
     * @returns {number[]}
     */
    getWeights: function() {
      var settings = this.settings,
          weights = [],
          layer,
          neuron,
          i,
          j,
          k;

      //for each layer
      for (i = 0; i <= settings.hiddenLayerCount; i++) {
        layer = this.layers[i];

        //for each neuron
        for (j = 0; j < layer.neurons.length; j++) {
          neuron = layer.neurons[j];

          //for each weight
          for (k = 0; k < neuron.weights.length; k++) {
            weights.push(neuron.weights[k]);
          }
        }
      }
      return weights;
    },

    /**
     * replaces the weights in the NN with the new values
     * @param {number[]} [weights]
     * @returns {NeuralNet}
     */
    putWeights: function(weights) {
      weights = weights || this.wisdom.weights;

      var settings = this.settings,
          cWeight = 0,
          layer,
          neuron,
          i,
          j,
          k;

      //for each layer
      for (i = 0; i <= settings.hiddenLayerCount; i++) {
        layer = this.layers[i];

        //for each neuron
        for (j = 0; j < layer.neurons.length; j++) {
          neuron = layer.neurons[j];

          //for each weight
          for (k = 0; k < neuron.weights.length; k++) {
            neuron.weights[k] = weights[cWeight++];
          }
        }
      }

      return this;
    },

    /**
     * returns the total number of weights needed for the net
     * @returns {number}
     */
    getNumWeights: function() {
      var weights = 0,
          layer,
          neuron,
          i,
          j,
          k;

      //for each layer
      for (i = 0; i < this.layers.length; i++) {
        layer = this.layers[i];

        //for each neuron
        for (j = 0; j < layer.neurons.length; j++) {
          neuron = layer.neurons[j];

          //for each weight
          for (k = 0; k < neuron.weights.length; k++) {
            weights++;
          }
        }
      }

      return weights;
    },

    /**
     * causes a chain reaction of analysis (neural net processing) of senses (inputs), which causes an action (outputs) and potentially a reward
     * @returns {NeuralNet}
     */
    think: function() {
      var settings = this.settings,
          inputs = settings.sense !== null ? settings.sense() : [],
          outputs = [],
          layer,
          neurons,
          neuron,
          weight = 0,
          netInput,
          inputCount,
          i,
          j,
          k;

      //first check that we have the correct amount of inputs
      if (inputs.length != settings.inputCount) {
        return this;
      }

      //For each layer....
      for (i = 0; i <= settings.hiddenLayerCount; i++) {
        layer = this.layers[i];
        neurons = layer.neurons;
        //After the first layer, the inputs get set to the output of previous layer
        if (i > 0) {
          //we clone the output so it isn't cleared after this step
          inputs = outputs.slice(0);
        }

        while(outputs.length > 0) {outputs.pop()}

        weight = 0;

        /*
        for each neuron sum the (inputs * corresponding weights).Throw
        the total at our sigmoid function to get the output
        */
        for (j = 0; j < neurons.length; j++) {
          neuron = neurons[j];
          netInput = 0;

          inputCount = neuron.weights.length;

          //for each weight
          for (k = 0; k < inputCount - 1; k++) {

            //sum the weights x inputs
            netInput += neuron.weights[k] * inputs[weight++];
          }

          //add in the bias
          netInput += neuron.weights[inputCount - 1] * settings.bias;

          /*
          we can store the outputs from each layer as we generate them.
          The combined activation is first filtered through the sigmoid
          function
          */
          outputs.push(this.sigmoid(netInput, settings.activationResponse));

          weight = 0;
        }
      }

      if (settings.action !== undefined) {
        settings.action(outputs);
      }

      if (settings.goal !== undefined) {
        this.wisdom.rewards += settings.goal();
      }

      return this;
    },

    sigmoid: function(netInput, response) {
      return (1 / (1 + Math.exp(-netInput / response)));
    }
  };

  NeuralNet.defaults = {
    bias: -1,
    inputCount: 2,
    outputCount: 2,
    hiddenLayerCount: 1,
    activationResponse: 1,
    hiddenLayerNeuronCount: 6,
    maxPerturbation: 0.3,

    sense: null,
    goal: null,
    action: null
  };

  return NeuralNet;
})(idea);