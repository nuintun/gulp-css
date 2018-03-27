/**
 * @module gulpfile
 * @license MIT
 * @version 2017/10/24
 */

'use strict';

const gulp = require('gulp');
const fs = require('fs-extra');
const bundler = require('../dist/index');
const relative = require('path').relative;
const through = require('@nuintun/through');

const ARGV = process.argv.slice(2);

/**
 * @function hasArgv
 * @param {string} argv
 */
function hasArgv(argv) {
  return ARGV.includes(argv);
}

const combine = hasArgv('--combine');

const plugins = [
  {
    name: 'Adam',
    transform(path, contents, options) {
      return contents;
    },
    bundle(path, contents, options) {
      return contents;
    }
  }
];

/**
 * @function unixify
 * @param {string} path
 */
function unixify(path) {
  return path.replace(/\\/g, '/');
}

/**
 * @function build
 */
function build() {
  fs.removeSync('dist');

  return gulp
    .src('assets/view/**/*.css', { base: 'assets' })
    .pipe(
      through((vinyl, enc, next) => {
        bundler.logger('Building', bundler.chalk.green(unixify(vinyl.relative)));
        next(null, vinyl);
      })
    )
    .pipe(bundler({ combine, plugins }))
    .pipe(gulp.dest('dist'));
}

// Register task
gulp.task('default', build);
