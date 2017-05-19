/**
 * Created by nuintun on 2015/4/27.
 */

'use strict';

var path = require('path');
var util = require('util');
var debug = require('debug')('gulp-css');
var plugins = require('./plugins/index');
var gutil = require('@nuintun/gulp-util');

var join = path.join;
var colors = gutil.colors;
var write = process.stdout.write;

/**
 * rename
 *
 * @param {any} path
 * @param {any} transform
 * @returns {String}
 */
function rename(path, transform) {
  return gutil.rename(path, transform, debug);
}

/**
 * transport
 *
 * @param {any} vinyl
 * @param {any} options
 * @param {any} done
 * @returns {void}
 */
function transport(vinyl, options, done) {
  return gutil.transport(vinyl, options, done, debug);
}

/**
 * resolve
 *
 * @param {any} relative
 * @param {any} vinyl
 * @param {any} wwwroot
 * @returns {String}
 */
function resolve(relative, vinyl, wwwroot) {
  return gutil.resolve(relative, vinyl, wwwroot, debug);
}

/**
 * pring
 *
 * @returns {void}
 */
function print() {
  var message = gutil.apply(util.format, null, gutil.slice.call(arguments));

  write(colors.cyan.bold('  gulp-css ') + message + '\n');
}

/**
 * get rename options
 *
 * @param transform
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
 * @param options
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
  options.plugins = gutil.plugins(options.plugins, plugins);
  // init rename
  options.rename = initRenameOptions(options.rename);

  return options;
}

/**
 * transport css dependencies.
 *
 * @param vinyl
 * @param options
 * @returns {Array}
 */
function transportCssDeps(vinyl, options) {
  var deps = [];
  var remote = [];
  var include = [];
  var pkg = vinyl.package || {};
  var onpath = options.onpath;
  var prefix = options.prefix;

  // init css settings
  onpath = gutil.isFunction(onpath) ? function(path, property) {
    return options.onpath(path, property, vinyl.path, options.wwwroot);
  } : null;

  prefix = gutil.isFunction(prefix) ? prefix(vinyl.path, options.wwwroot) : prefix;

  // replace imports and collect dependencies
  vinyl.contents = new Buffer(css(vinyl.contents, function(id) {
    var path;

    // id is not a local file
    if (!gutil.isLocal(id)) {
      // cache dependencie id
      deps.push(id);
      remote.push(id);
    } else {
      // normalize id
      id = gutil.normalize(id);

      // if end with /, find index file
      if (id.substring(id.length - 1) === '/') {
        id += 'index.css';
      }

      // set path
      path = id;
      // rename id
      id = rename(path, options.rename);

      // normalize id
      id = gutil.normalize(id);

      // debug
      debug('transport deps: %s', colors.magenta(id));

      // get absolute path
      path = resolve(path, vinyl, options.wwwroot);

      // cache dependencie id
      deps.push(id);
      // cache dependencie absolute path
      include.push(path);
    }

    // include import css file
    if (options.include) {
      // delete all import
      return false;
    }

    // onpath callback
    if (gutil.isString(path = onpath(id, 'import'))) {
      return path;
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

/**
 * exports module
 */
module.exports = {
  debug: debug,
  rename: rename,
  transport: transport,
  resolve: resolve,
  print: print,
  initOptions: initOptions,
  transportCssDeps: transportCssDeps
};
