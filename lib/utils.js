/**
 * @module utils
 * @license MIT
 * @version 2017/11/13
 */

'use strict';

const path = require('path');
const util = require('util');
const css = require('@nuintun/css-deps');
const gutil = require('@nuintun/gulp-util');

const join = path.join;
const dirname = path.dirname;
const cache = new gutil.Cache();
const debug = gutil.debug('gulp-css');

/**
 * @function transport
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @param {Function} done
 */
function transport(vinyl, options, done) {
  return gutil.transport(vinyl, options, done, cache, debug);
}

/**
 * @function resolve
 * @description Resolve a id from file or wwwroot path
 * @param {string} id
 * @param {Vinyl} vinyl
 * @param {string} wwwroot
 * @returns {string}
 */
function resolve(id, vinyl, wwwroot) {
  let path;

  // resolve
  if (gutil.isAbsolute(id)) {
    path = join(wwwroot, id);
  } else {
    path = join(dirname(vinyl.path), id);

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
 * @function print
 */
function print() {
  const message = gutil.apply(util.format, null, gutil.slice.call(arguments));

  process.stdout.write(gutil.chalk.reset.cyan.bold('  gulp-css ') + message + '\n');
}

/**
 * @function initOptions
 * @param {Object} options
 * @returns {Object}
 */
function initOptions(options) {
  options = gutil.extend(
    true,
    {
      map: [], // The map
      include: false, // Include
      prefix: null, // CSS prefix
      onpath: null, // CSS resource path callback
      cache: true, // Use memory file cahe
      wwwroot: '' // Web root dir
    },
    options
  );

  // Option wwwroot must be string
  if (!gutil.isString(options.wwwroot)) {
    gutil.throwError("options.wwwroot's value should be string.");
  }

  // Init wwwroot dir
  options.wwwroot = join(gutil.cwd, options.wwwroot);

  // Init plugins
  options.plugins = gutil.plugins(options.plugins, require('./plugins/index'));

  return options;
}

/**
 * @function transportId
 * @description Transport vinyl id
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @returns {string}
 */
function transportId(vinyl, options) {
  // Parse module id
  let id = gutil.parseId(vinyl, options.wwwroot, vinyl.base);

  // Normalize
  id = gutil.normalize(id);

  // Debug
  debug('module id: %p', id);

  // Parse map
  id = gutil.parseMap(id, options.map, vinyl.base, options.wwwroot);
  // Normalize id
  id = gutil.normalize(id);

  // Rewrite vinyl path
  if (gutil.isAbsolute(id)) {
    vinyl.path = join(options.wwwroot, id);
  } else {
    vinyl.path = join(vinyl.cwd, vinyl.base, id);
  }

  // Set vinyl package info
  vinyl.package = { id: id };

  return id;
}

/**
 * @function transportCssDeps
 * @description Transport css dependencies.
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @returns {Array}
 */
function transportCssDeps(vinyl, options) {
  const deps = [];
  const remote = [];
  const include = [];
  let onpath = options.onpath;
  let prefix = options.prefix;
  const pkg = vinyl.package || {};

  // Init css settings
  onpath = gutil.isFunction(onpath)
    ? (path, property) => {
        return options.onpath(path, vinyl.path, options.wwwroot, property);
      }
    : null;

  prefix = gutil.isFunction(prefix) ? prefix(vinyl.path, options.wwwroot) : prefix;

  // Replace imports and collect dependencies
  vinyl.contents = new Buffer(
    css(
      vinyl.contents,
      id => {
        if (gutil.isLocal(id)) {
          const src = id;

          // Normalize id
          id = gutil.normalize(id);

          // If end with /, find index file
          if (id.substring(id.length - 1) === '/') {
            id += 'index.css';
          }

          // Debug
          debug('module deps: %p', id);

          // Cache dependencie absolute path
          include.push({
            id: src,
            path: resolve(id, vinyl, options.wwwroot)
          });

          // Normalize id
          id = gutil.normalize(id);

          // Only when include is false, map can work
          if (!options.include) {
            // Parse map
            id = gutil.parseMap(id, options.map, vinyl.base, options.wwwroot);
            // Normalize id
            id = gutil.normalize(id);
          }
        } else {
          // Debug
          debug('module remote deps: %p', id);

          // Remote module
          remote.push(id);
        }

        // Cache dependencie id
        deps.push(id);

        // Include import css file
        if (options.include) {
          // Delete all import
          return false;
        }

        // Don't make changes
        return id;
      },
      { prefix: prefix, onpath: onpath }
    )
  );

  // Cache file dependencies
  vinyl.package = gutil.extend(pkg, {
    remote: remote,
    include: include,
    dependencies: deps
  });

  return deps;
}

// Exports
module.exports = {
  debug,
  cache,
  print,
  transport,
  initOptions,
  transportId,
  transportCssDeps
};
