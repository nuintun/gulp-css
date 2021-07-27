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

const map = (path, _resolved) => {
  return path.replace(/^\/assets\//, '/dist/');
};

const onpath = (_prop, path, referer) => {
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
    moduleDidLoaded(_path, contents, _options) {
      bundler.logger.log('[hook]', bundler.chalk.cyan('moduleDidLoaded'));

      return contents;
    },
    moduleDidParsed(_path, contents, _options) {
      bundler.logger.log('[hook]', bundler.chalk.cyan('moduleDidParsed'));

      return contents;
    },
    moduleDidCompleted(_path, contents, _options) {
      bundler.logger.log('[hook]', bundler.chalk.cyan('moduleDidCompleted'));

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
    .src(combine ? 'assets/view/**/*.css' : 'assets/**/*.css', { base: 'assets' })
    .pipe(
      through((vinyl, _enc, next) => {
        bundler.logger.log('Building', bundler.chalk.green(unixify(vinyl.relative)));

        next(null, vinyl);
      })
    )
    .pipe(bundler({ map, combine, onpath, plugins }))
    .pipe(gulp.dest('dist'));
}

// Register task
gulp.task('default', build);
