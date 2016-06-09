var gulp = require('gulp');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var inject = require('gulp-inject');
var watch = require('gulp-watch');
var preprocess = require('gulp-preprocess');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
var sassGlob = require('gulp-sass-glob');
var minifyCss = require('gulp-clean-css');
var gutil = require('gulp-util');

var paths = {
    sass: ['./scss/**/*.scss'],
    index: ['./app/js/**/*.js', './app/index.template.html']
};

gulp.task('default', ['sass', 'index']);

gulp.task('sass', function () {
    gulp.src('./scss/app.scss')
        .on('error', gutil.log)
        .pipe(sourcemaps.init())
        .pipe(sassGlob())
        .pipe(sass())
        .pipe(minifyCss())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./app/style/'));
});

gulp.task('index', function () {
    return gulp.src('./app/index.template.html')
        .on('error', gutil.log)
        .pipe(inject(gulp.src('./app/js/**/*.js', {read: false}), {relative: true}))
        .pipe(rename("index.html"))
        .pipe(gulp.dest('./app'));
});

gulp.task('watch', function () {
    gulp.src(paths.sass)
        .on('error', gutil.log)
        .pipe(watch(paths.sass, function () {
            gulp.start('sass');
        }));
    gulp.src(paths.index)
        .on('error', gutil.log)
        .pipe(watch(paths.index, function () {
            gulp.start('index');
        }));
});
