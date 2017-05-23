/*!
 * util
 * Version: 0.0.1
 * Date: 2017/05/19
 * https://github.com/nuintun/gulp-css
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/gulp-css/blob/master/LICENSE
 */

'use strict';

var path = require('path');
var util = require('util');
var css = require('@nuintun/css-deps');
var gutil = require('@nuintun/gulp-util');

var join = path.join;
var dirname = path.dirname;
var cache = new gutil.Cache();
var debug = gutil.debug('gulp-css');

/**
 * rename
 *
 * @param {String} path
 * @param {Function} transform
 * @returns {String}
 */
function rename(path, transform) {
  return gutil.rename(path, transform, debug);
}

/**
 * transport
 *
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @param {Function} done
 * @returns {void}
 */
function transport(vinyl, options, done) {
  return gutil.transport(vinyl, options, done, cache, debug);
}

/**
 * resolve a `relative` path base on `base` path
 *
 * @param {String} relative
 * @param {Vinyl} vinyl
 * @param {String} wwwroot
 * @returns {String}
 */
function resolve(relative, vinyl, wwwroot) {
  var base;
  var path;

  // resolve
  if (gutil.isAbsolute(relative)) {
    base = wwwroot;
    path = join(base, relative.substring(1));
  } else {
    base = dirname(vinyl.path);
    path = join(base, relative);

    // out of wwwroot
    if (gutil.isOutBound(path, wwwroot)) {
      gutil.throwError('file: %s is out of bound of wwwroot: %s.', gutil.normalize(path), gutil.normalize(wwwroot));
    }
  }

  // debug
  debug('resolve path: %r', path);

  return path;
}

/**
 * pring
 *
 * @returns {void}
 */
function print() {
  var message = gutil.apply(util.format, null, gutil.slice.call(arguments));

  process.stdout.write(gutil.colors.reset.cyan.bold('  gulp-css ') + message + '\n');
}

/**
 * get rename options
 *
 * @param {Function} transform
 * @returns {object}
 */
function initRenameOptions(transform) {
  if (gutil.isFunction(transform)) {
    return transform;
  }

  transform = transform || {};

  if (transform.min) {
    transform.suffix = '-min';
  }

  if (transform.debug) {
    transform.suffix = '-debug';
  }

  return transform;
}

/**
 * init options
 *
 * @param {Object} options
 * @returns {object}
 */
function initOptions(options) {
  options = gutil.extend(true, {
    include: false, // include
    prefix: null, // css prefix
    onpath: null, // css resource path callback
    cache: true, // use memory file cahe
    wwwroot: '', // web root
    rename: null // { debug: boolean, min: boolean }
  }, options);

  // wwwroot must be string
  if (!gutil.isString(options.wwwroot)) {
    gutil.throwError('options.wwwroot\'s value should be string.');
  }

  // init wwwroot
  options.wwwroot = join(gutil.cwd, options.wwwroot);
  // init plugins
  options.plugins = gutil.plugins(options.plugins, require('./plugins/index'));
  // init rename
  options.rename = initRenameOptions(options.rename);

  return options;
}

/**
 * transport css dependencies.
 *
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @returns {Array}
 */
function transportCssDeps(vinyl, options) {
  var deps = [];
  var remote = [];
  var include = [];
  var onpath = options.onpath;
  var prefix = options.prefix;
  var pkg = vinyl.package || {};

  // init css settings
  onpath = gutil.isFunction(onpath) ? function(path, property) {
    return options.onpath(path, property, vinyl.path, options.wwwroot);
  } : null;

  prefix = gutil.isFunction(prefix) ? prefix(vinyl.path, options.wwwroot) : prefix;

  // replace imports and collect dependencies
  vinyl.contents = new Buffer(css(vinyl.contents, function(id) {
    if (gutil.isLocal(id)) {
      // normalize id
      id = gutil.normalize(id);

      // if end with /, find index file
      if (id.substring(id.length - 1) === '/') {
        id += 'index.css';
      }

      // debug
      debug('module deps: %p', id);

      var path;

      // get absolute path
      path = resolve(id, vinyl, options.wwwroot);

      // rename id
      id = rename(id, options.rename);
      // normalize id
      id = gutil.normalize(id);
      // parse map
      id = gutil.parseMap(id, options.map);
      // normalize id
      id = gutil.normalize(id);

      // cache dependencie id
      deps.push(id);
      // cache dependencie absolute path
      include.push(path);
    } else {
      // debug
      debug('module remote deps: %p', id);

      // cache dependencie id
      deps.push(id);
      remote.push(id);
    }

    // include import css file
    if (options.include) {
      // delete all import
      return false;
    }

    // don't make changes
    return id;
  }, { prefix: prefix, onpath: onpath }));

  // cache file dependencies
  vinyl.package = gutil.extend(pkg, {
    remote: remote,
    include: include,
    dependencies: deps
  });

  return deps;
}

// exports
module.exports = {
  debug: debug,
  cache: cache,
  rename: rename,
  transport: transport,
  print: print,
  initOptions: initOptions,
  transportCssDeps: transportCssDeps
};
