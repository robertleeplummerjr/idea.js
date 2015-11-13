var idea = (function() {
    "use strict";
    return {};
})();
idea.Hive = (function(idea) {
  "use strict";

  function randomResult(array) {
    return array[Math.floor(Math.random() * (array.length - 1))];
  }

  /**
   *
   * @param {Object} settings
   * @constructor
   */
  function Hive(settings) {
    var defaults = Hive.defaults,
        i,
        collection = this.collection = [],
        _settings = {};

    settings = settings || {};
    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      _settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }

    this.settings = settings = _settings;
    this.totalRewards = 0;
    this.bestRewards = 0;
    this.avgRewards = 0;
    this.lowestRewards = Hive.defaults.worstRewards;
    this.bestWisdom = null;
    this.elites = [];
    this.nonElites = [];

    for (i = 0; i < settings.count; i++) {
      collection.push(settings.initType());
    }
  }

  Hive.prototype = {
    /**
     *
     * @param {*} teacher
     * @param {*} student
     * @returns {Hive}
     */
    teach: function(teacher, student) {
      var i = 0,
          studentWisdom = new idea.Wisdom([], this.settings.maxPerturbation),
          teacherWisdom = teacher.brain.wisdom,
          weights = teacher.brain.wisdom.weights,
          crossoverPoint,
          max = weights.length;

      if (Math.random() > this.settings.crossoverRate) {
        for (; i < max; i++) {
          studentWisdom.weights[i] = teacherWisdom.weights[i];
        }
      } else {
        // Pick a crossover point.
        crossoverPoint = Math.floor((Math.random() * (this.settings.weightCount - 1)));

        // Swap weights
        for (; i < crossoverPoint; i++) {
          studentWisdom.weights[i] = teacherWisdom.weights[i];
        }

        for (i = crossoverPoint; i < max; i++) {
          studentWisdom.weights[i] = teacherWisdom.weights[i];
        }
      }

      studentWisdom.hypothesize(this.settings.mutationRate);
      student.brain.wisdom = studentWisdom;
      student.brain.putWeights();

      return this;
    },

    // Maybe switch this out with Tournament selection?
    /**
     *
     * @returns {idea.Wisdom}
     */
    select: function() {
      var slice = Math.random() * this.totalRewards,
          settings = this.settings,
          item,
          chosen = null,
          currentRewards = 0,
          max = settings.count,
          i = 0;

      // Keep adding rewards until it is above the slice,
      // then we stop and take the current wisdom
      for (; i < max; i++) {
        item = this.collection[i];
        currentRewards += item.brain.wisdom.rewards;
        if (currentRewards >= slice) {
          chosen = item;
          break;
        }
      }
      return chosen;
    },

    /**
     *
     * @param {number} [eliteCount]
     * @param {boolean} [resetRewards]
     * @returns {Hive}
     */
    setElites: function(eliteCount, resetRewards) {
      eliteCount = eliteCount || this.settings.eliteCount;
      resetRewards = resetRewards !== undefined ? resetRewards : true;

      var item,
          collection = this.collection,
          settings = this.settings,
          elites = this.elites = [],
          nonElites = this.nonElites = [],
          i = 0,
          max = settings.count,
          nonEliteCount = max - eliteCount;

      for (;i < max; i++) {
        item = collection[i];

        if (resetRewards) {
          item.brain.wisdom.rewards = 0;
        }

        if (nonElites.length < nonEliteCount) {
          nonElites.push(item);
        } else {
          elites.push(item);
        }
      }

      elites.reverse();
      nonElites.reverse();

      return this;
    },

    /**
     *
     * @returns {Hive}
     */
    calcStats: function() {
      this.sort();
      this.totalRewards = 0;
      var bestRewards = 0,
          settings = this.settings,
          rewards,
          wisdom,
          item,
          max = settings.count,
          lowestRewards = this.lowestRewards,
          i = 0;

      for (; i < max; i++) {
        item = this.collection[i];
        wisdom = item.brain.wisdom;
        rewards = wisdom.rewards;
        if (rewards > bestRewards) {
          bestRewards = rewards;
          this.bestRewards = bestRewards;
          this.bestWisdom = wisdom;
        }

        if (rewards < lowestRewards) {
          lowestRewards = rewards;
          this.lowestRewards = lowestRewards;
        }
        this.totalRewards += rewards;
      }

      this.avgRewards = this.totalRewards / this.settings.count;
      return this;
    },
    resetStats: function() {
      this.totalRewards = 0;
      this.bestRewards = 0;
      this.lowestRewards = Hive.defaults.worstRewards;
      this.avgRewards = 0;

      return this;
    },
    sort: function() {
      this.collection.sort(function(a, b) {
        if (a.brain.wisdom.rewards > b.brain.wisdom.rewards) {
          return 1;
        } else if (a.brain.wisdom.rewards < b.brain.wisdom.rewards) {
          return -1;
        } else {
          return 0;
        }
      });

      return this;
    },
    learn: function() {
      this
          .sort()
          .calcStats()
          .setElites();

      var elites = this.elites,
          elite,
          nonElites = this.nonElites,
          nonElite,
          max = nonElites.length,
          i = 0;

      for (; i < max; i++) {
        elite = randomResult(elites) || this.select();
        nonElite = nonElites[i];
        this.teach(elite, nonElite);
      }

      return this;
    }
  };

  Hive.defaults = {
    initType: function() {
      return null;
    },
    worstRewards: 9999999,
    count: 30,
    mutationRate: 0.1,
    crossoverRate: 0.7,
    weightCount: 0,
    maxPerturbation: 0.3,
    eliteCount: 5,
    eliteCopiesCount: 1
  };

  return Hive;
})(idea);
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
idea.Neuron = (function() {
  "use strict";

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

  return Neuron;
})();
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
idea.Wisdom = (function(idea) {
  "use strict";

  /**
   *
   * @param {number[]} weights
   * @param {number} maxPerturbation
   * @param {number} [rewards]
   * @constructor
   */
  function Wisdom(weights, maxPerturbation, rewards) {
    this.weights = weights;
    this.maxPerturbation = maxPerturbation;
    this.rewards = rewards || 0;
  }

  Wisdom.prototype = {
    /**
     *
     * @returns {Wisdom}
     */
    hypothesize: function(mutationRate) {
      var i = 0,
          max = this.weights.length;

      for (; i < max; i++) {
        if (Math.random() < mutationRate) {
          this.weights[i] += (Math.random() - Math.random()) * this.maxPerturbation;
        }
      }
      return this;
    },
    reward: function() {
      this.rewards++;
      return this;
    }
  };

  return Wisdom;
})(idea);