var fs = require('fs');

fs.writeFileSync('idea.js', fs.readFileSync('./src/package.js').toString()
  .replace('CODE_HERE', ([
        './src/colony',
        './src/colony/ant',
        './src/colony/edge',
        './src/colony/graph',
        './src/colony/point',
        './src/colony/tour',

        './src/hive',
        './src/hive/net',
        './src/hive/neuron',
        './src/hive/synapses',
        './src/hive/wisdom',

        './src/meta-heuristic',
        './src/meta-heuristic/heuristic'
      ]
      .reduce(function (src, curr) {
        return src + '\n' + fs.readFileSync(curr + '.js').toString();
      }, '')

      /** removes
       * use 'strict';
       * */

      .replace(/'use strict';\n+/g, '')
      /** removes
       * var name = require('name');
       * var aName = require('a-name');
       * var name = require('name'),
       *  aName = require('a-name');
       * */

      .replace(/(\n*(var)?\s*[A-Za-z]+\s*[=]\s*require[(]['][a-z-/]+['][)][;,][\n]*)+/g, '')

      /** removes
       * module.exports = Something;
       * */
      .replace(/\n*module[.]exports\s*[=]\s*[A-Za-z]+[;]/g, '')
  )));
