var gulp = require('gulp'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    nodemon = require('gulp-nodemon');


gulp.task('scripts', function () {
  return browserify('./public/js/main.js')
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./public/build/js'));
});

gulp.task('css', function () {
  gulp.src('./public/css/*.css')
    .pipe(gulp.dest('./public/build/css'))
});

gulp.task('images', function () {
  gulp.src('./public/images/*')
    .pipe(gulp.dest('./public/build/images'))
});

gulp.task('html', function () {
  gulp.src('./public/*.html')
    .pipe(gulp.dest('./public/build'))
});

gulp.task('default', function () {
  nodemon({
    script: 'app.js',
    ext: 'html js css'
  })
  .on('change', ['scripts', 'css', 'images', 'html'])
  .on('restart', function () {
    console.log('restarted!')
  });
});
