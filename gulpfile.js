var gulp          = require('gulp'),
    fs            = require('fs'),
    $             = require('gulp-load-plugins')(),
    pngquant      = require('imagemin-pngquant'),
    mergeStream   = require('merge-stream'),
    webpack       = require('webpack-stream'),
    webpackBundle = require('webpack'),
    named         = require('vinyl-named');


// Sassのタスク
gulp.task('sass', function () {
  return gulp.src([
    './src/scss/**/*.scss'
  ])
    .pipe($.plumber({
      errorHandler: $.notify.onError('<%= error.message %>')
    }))
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe( $.sassGlob() )
    .pipe($.sass({
      errLogToConsole: true,
      outputStyle    : 'compressed',
    }))
    .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%', 'ie >= 11']}))
    .pipe($.sourcemaps.write('./map'))
    .pipe(gulp.dest('./assets/css'));
});


// Minify All
gulp.task('js', function () {
  let tmp = {};
  return gulp.src([
    './src/js/**/*.js',
    '!./src/js/**/_*.js'
  ])
    .pipe($.plumber({
      errorHandler: $.notify.onError('<%= error.message %>')
    }))
    .pipe(named())
    .pipe($.rename(function (path) {
      tmp[path.basename] = path.dirname;
      console.log(tmp, path);
    }))
    .pipe(webpack({
      mode: 'production',
      devtool: 'source-map',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
                plugins: ['@babel/plugin-transform-react-jsx']
              }
            }
          }
        ]
      }
    }, webpackBundle))
    .pipe($.rename(function (path) {
      if ( tmp[path.basename] ) {
        path.dirname = tmp[path.basename];
      } else if ( '.map' === path.extname && tmp[path.basename.replace(/\.js$/, '')] ) {
        path.dirname = tmp[path.basename.replace(/\.js$/, '')];
      }
      return path;
    }))
    .pipe(gulp.dest('./assets/js/'));
});


// JS Hint
gulp.task('eslint', function () {
  return gulp.src(['src/**/*.js'])
    .pipe($.eslint({ useEslintrc: true }))
    .pipe($.eslint.format());
});

// Image min
gulp.task('imagemin', function () {
  return gulp.src('./src/img/**/*')
    .pipe($.imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use        : [pngquant()]
    }))
    .pipe(gulp.dest('./assets/img'));
});


// watch
gulp.task('watch', function () {
  // Make SASS
  gulp.watch([
    'src/scss/**/*.scss',
  ], gulp.task('sass'));
  // JS
  gulp.watch(['src/js/**/*.js'], gulp.parallel('js', 'eslint'));
  // Minify Image
  gulp.watch('src/img/**/*', gulp.task('imagemin') );
});

// Build
gulp.task('build', gulp.parallel('eslint', 'js', 'sass', 'imagemin'));

// Default Tasks
gulp.task('default', gulp.task('watch'));
