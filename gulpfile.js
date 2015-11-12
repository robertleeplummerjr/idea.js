var gulp = require('gulp')
  , concat = require('gulp-concat')
  ;

gulp.task('default', function() {
  return gulp.src([
        './src/idea/base.js',
        './src/idea/Hive.js',
        './src/idea/NeuralNet.js',
        './src/idea/Neuron.js',
        './src/idea/NeuronLayer.js',
        './src/idea/Wisdom.js'
    ])
    .pipe(concat('idea.js'))
    .pipe(gulp.dest('./'));
});