/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-25T18:01:45-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: gulpfile.js
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T04:49:47-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

const gulp = require('gulp');
const pump = require('pump');
const javascriptObfuscator = require('gulp-javascript-obfuscator');
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");

gulp.task('release', function(cb) {
  pump([
    tsProject.src()
      .pipe(tsProject())
      .js.pipe(gulp.dest("build")),
    gulp.src('build/**/*.js'),
    javascriptObfuscator(),
    gulp.dest('dist-obf')
  ], cb);
});
