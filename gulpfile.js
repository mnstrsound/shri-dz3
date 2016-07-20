'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var jade = require('gulp-jade');
var concat = require('gulp-concat');
var browserSync = require('browser-sync').create();

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
});

gulp.task('sass', function () {
    gulp.src('sass/**/*.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(concat('build.css'))
        .pipe(gulp.dest('build/css'));
});

gulp.task('moveJS', function () {
    gulp.src('js/**/*.js')
        .pipe(concat('build.js'))
        .pipe(gulp.dest('build/js'));
});

gulp.task('moveImg', function () {
    gulp.src('img/**/*')
        .pipe(gulp.dest('build/img'));
});

gulp.task('jade', function() {
    gulp.src('jade/**/*.jade')
        .pipe(jade({
            //pretty: true,
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('build', ['moveJS', 'moveImg','sass', 'jade']);

gulp.task('watch', function () {
    gulp.watch('sass/**/*.scss', ['sass']);
    gulp.watch('js/**/*.js', ['moveJS']);
    gulp.watch('img/**/*', ['moveImg']);
    gulp.watch('jade/**/*.jade', ['jade']);
});