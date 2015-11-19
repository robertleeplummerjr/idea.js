# idea.js
artificial intelligence problem solver

## Why?
Machine Learning doesn't have to be complicated.  idea.js makes AI's (neural networks, neurons, meta heuristic, heuristic, and ant colony optimizations) simple.

## How?
By telling idea.js what you want to do, it figures out how to do it.

## Example:
By giving the machine rewards for reaching closer and closer to a goal it gets smarter.

```javascript
var brain = new idea.NueralNet({
  sense: function() {
    //give brain feedback
    var inputs = [];
    return inputs;
  },
  goal: function() {
    //return goal response here, greater than 0 is a reward.  0 or less is discipline
    return 1;
  },
  action: function() {
    //what happens next?
  }
});

setInterval(function() {
  brain.think();
}, 0);
```
