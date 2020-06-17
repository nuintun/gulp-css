/**
 * @module gulpfile
 * @license MIT
 * @version 2017/10/24
 */

'use strict';

const gulp = require('gulp');
const fs = require('fs-extra');
const bundler = require('../index');
const through = require('@nuintun/through');
const { relative, join, dirname } = require('path');

const root = process.cwd();
const ARGV = process.argv.slice(2);

/**
 * @function hasArgv
 * @param {string} argv
 */
function hasArgv(argv) {
  return ARGV.includes(argv);
}

const combine = hasArgv('--combine');

const map = (path, resolved) => {
  return path.replace(/^\/assets\//, '/dist/');
};

const onpath = (prop, path, referer) => {
  if (/^(?:[a-z0-9.+-]+:)?\/\/|^data:\w+?\/\w+?[,;]/i.test(path)) {
    return path;
  }

  if (!path.startsWith('/')) {
    path = join(dirname(referer), path);
    path = '/' + unixify(relative(root, path));
  }

  path = path.replace(/^\/assets/, '/dist');

  return path;
};

const plugins = [
  {
    name: 'Adam',
    moduleDidLoad(path, contents, options) {
      return contents;
    },
    moduleDidParse(path, contents, options) {
      return contents;
    },
    moduleWillBundle(path, contents, options) {
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
        bundler.logger.log('Building', bundler.chalk.green(unixify(vinyl.relative)));
        next(null, vinyl);
      })
    )
    .pipe(bundler({ map, combine, onpath, plugins }))
    .pipe(gulp.dest('dist'));
}

// Register task
gulp.task('default', build);
