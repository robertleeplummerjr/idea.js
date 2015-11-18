# idea.js
artificial intelligence problem solver

Why?
Machine Learning doesn't have to be complicated.  idea.js makes AI's (neural networks, neurons, meta heuristic, heuristic, and ant colony optimizations) simple.

How?
By telling idea.js what you want to do, it figures out how to do it.


Example:

```javascript
var brain = new idea.NueralNet({sense: function() {
      //give brain feedback
      var inputs = [];
      return inputs;
    },
    goal: function() {
      //return goal response here
      return 1;
    },
    action: function(movements) {
      //what happens next?
    }
  });

setInterval(function() {
  brain.think();
}, 0);
```
