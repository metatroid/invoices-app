var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

//copy bower components to build dir
gulp.task('bowercopy', function(){
  gulp.src(['bower_components/angular/angular.js', 'bower_components/angular-ui-router/release/angular-ui-router.js', 'bower_components/angular-animate/angular-animate.js', 'bower_components/angular-aria/angular-aria.js', 'bower_components/angular-material/angular-material.js'])
    .pipe($.rename({dirname: ''}))
    .pipe(gulp.dest('build/js/libs/'));
  gulp.src(['bower_components/bootstrap-sass/assets/stylesheets/**/*'])
    .pipe(gulp.dest('build/sass/libs/bootstrap/'));
  gulp.src(['bower_components/components-font-awesome/scss/*'])
    .pipe(gulp.dest('build/sass/libs/font-awesome/'));
  gulp.src(['bower_components/angular-material/angular-material.scss'])
    .pipe(gulp.dest('build/sass/libs/'));
  gulp.src(['bower_components/components-font-awesome/fonts/**/*'])
    .pipe($.rename({dirname: ''}))
    .pipe(gulp.dest('static/assets/fonts/icons'));
});

//build app js
gulp.task('js', function(){
  return gulp.src(['build/js/app/invoices.js', 'build/js/app/components/**/*.js'])
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'))
    .pipe($.concat('app.js'))
    .pipe(gulp.dest('build/js'));
});

//compile libs+app js
gulp.task('jsall', ['js'], function(){
  gulp.src(['build/js/libs/angular.js', 'build/js/libs/angular-ui-router.js', 'build/js/libs/angular-animate.js', 'build/js/libs/angular-aria.js', 'build/js/libs/angular-material.js', 'build/js/app.js'])
    .pipe($.concat('main.js'))
    .pipe(gulp.dest('static/assets/js'))
    .pipe($.rename('main.min.js'))
    .pipe($.uglify())
    .pipe(gulp.dest('static/assets/js'));
});

//sass
gulp.task('sass', function(){
  gulp.src('build/sass/main.scss')
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(gulp.dest('static/assets/css'));
});

//haml
gulp.task('haml', function(){
  gulp.src('build/haml/**/*.haml')
    .pipe($.haml({ext: '.html'}))
    .pipe(gulp.dest('build/html'))
    .pipe($.copy('angular', {prefix: 2}));
});

//img optimization
gulp.task('img', function(){
  gulp.src('build/img/**/*')
    .pipe($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{removeUnknownsAndDefaults: false}]
    }))
    .pipe(gulp.dest('static/assets/img'))
});

gulp.task('default', ['js', 'jsall', 'sass', 'haml', 'img'], function(){
  gulp.watch('build/js/app/**/*.js', ['js', 'jsall']);
  gulp.watch('build/sass/**/*.scss', ['sass']);
  gulp.watch('build/haml/**/*.haml', ['haml']);
  gulp.watch('build/img/**/*', ['img']);
});