# idea.js
artificial intelligence problem solver

## Why?
Machine Learning doesn't have to be complicated.  idea.js makes AI's (neural networks, meta heuristic, heuristic, ant colony optimizations, and hives) simple.

## How?
By telling idea.js what you want to do, it figures out how to do it.

## Demos:
* Smart Sweepers: http://robertleeplummerjr.github.io/idea.js/examples/smartSweepers.html
* Travelling Salesman: http://robertleeplummerjr.github.io/idea.js/examples/travellingSalesman.html

## Example:
By giving the machine rewards for reaching closer and closer to a goal it gets smarter.

```javascript
var brain = new idea.NeuralNet({
  sense: function() {
    //give brain feedback
    var inputs = [];
    return inputs;
  },
  goal: function() {
    //return goal response here, greater than 0 is a reward.  0 or less is discipline
    return 1;
  },
  action: function(outputs) {
    //what happens next?  Do something with outputs...
  }
});

setInterval(function() {
  brain.think();
}, 0);
```

Or have a Hive of Neural Networks work together:
```javascript
function GeorgeCostanza() {
  this.brain = new idea.NeuralNet({
    sense: function() {
      //give brain feedback
      var inputs = [];
      return inputs;
    },
    goal: function() {
      //return goal response here, greater than 0 is a reward.  0 or less is discipline
      return 1;
    },
    action: function(outputs) {
      //what happens next?  Do something with outputs...
    }
  });
}

var hive = new idea.Hive({
  count: 50,
  initType: function() {
    return new GeorgeCostanza();
  }
});

setInterval(function() {
  hive.live(function(georgeCostanza) {
    //do something after George has thought
  });

  //cause the group to evaluate who are elite (who have received the most rewards) and get the elites to train non-elites and hypothesise on what to do to be more successful
  hive.beginNewDay();
}, 0);
```
