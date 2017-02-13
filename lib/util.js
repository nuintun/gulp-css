/**
 * Created by nuintun on 2015/4/27.
 */

'use strict';

var is = require('is');
var path = require('path');
var join = path.join;
var dirname = path.dirname;
var relative = path.relative;
var util = require('util');
var colors = require('colors/safe');
var debug = require('debug')('gulp-css');

// variable declaration
var cwd = process.cwd();
// regexp
var BACKSLASH_RE = /\\/g;
var DOT_RE = /\/\.\//g;
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;
var MULTI_SLASH_RE = /([^:/])\/+\//g;
var PROTOCOL_SLASH_RE = /(:)?\/{2,}/;

// set debug color use 6
debug.color = 6;

/**
 * normalize path
 * @param path
 * @returns {string}
 */
function normalize(path) {
  // \a\b\.\c\.\d ==> /a/b/./c/./d
  path = path.replace(BACKSLASH_RE, '/');

  // :///a/b/c ==> ://a/b/c
  path = path.replace(PROTOCOL_SLASH_RE, '$1//');

  // /a/b/./c/./d ==> /a/b/c/d
  path = path.replace(DOT_RE, '/');

  // @author wh1100717
  // a//b/c ==> a/b/c
  // a///b/////c ==> a/b/c
  // DOUBLE_DOT_RE matches a/b/c//../d path correctly only if replace // with / first
  path = path.replace(MULTI_SLASH_RE, '$1/');

  // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, '/');
  }

  // get path
  return path;
}

/**
 * resolve a `relative` path base on `base` path
 * @param relative
 * @param vinyl
 * @param wwwroot
 * @returns {string}
 */
function resolve(relative, vinyl, wwwroot) {
  var base;
  var absolute;

  // resolve
  if (isAbsolute(relative)) {
    base = wwwroot;
    absolute = join(base, relative.substring(1));
  } else {
    base = dirname(vinyl.path);
    absolute = join(base, relative);

    // out of base, use wwwroot
    if (isRelative(absolute)) {
      base = wwwroot;
      absolute = join(base, relative);

      // out of wwwroot
      if (isOutBound(absolute, wwwroot)) {
        throwError('file: %s is out of bound of wwwroot: %s.', normalize(absolute), normalize(wwwroot));
      }
    }
  }

  // debug
  debug('resolve path: %s', colors.magenta(normalize(relative)));
  debug('of base path: %s', colors.magenta(pathFromCwd(base)));
  debug('to: %s', colors.magenta(pathFromCwd(absolute)));

  return absolute;
}

/**
 * test path is relative path or not
 * @param path
 * @returns {boolean}
 */
function isRelative(path) {
  return /^\.{1,2}[\\/]/.test(path);
}

/**
 * test path is absolute path or not
 * @param path
 * @returns {boolean}
 */
function isAbsolute(path) {
  return /^[\\/](?:[^\\/]|$)/.test(path);
}

/**
 * test path is local path or not
 * @param path
 * @returns {boolean}
 */
function isLocal(path) {
  return !/^\w*?:\/\/|^\/\//.test(path) && !/^data:\w+?\/\w+?[,;]/i.test(path);
}

/**
 * test path is out of bound of base
 * @param path
 * @param base
 * @returns {boolean}
 */
function isOutBound(path, base) {
  return /(?:^[\\\/]?)\.\.(?:[\\\/]|$)/.test(relative(base, path));
}

/**
 * get relative path from cwd
 * @param path
 * @returns {string}
 */
function pathFromCwd(path) {
  return normalize(relative(cwd, path)) || './';
}

/**
 * plugin error
 */
function throwError() {
  var slice = [].slice;
  var message = util.format
    .apply(null, slice.call(arguments));

  throw new Error(message);
}

/**
 * print message
 */
function print() {
  var slice = [].slice;
  var message = util.format
    .apply(null, slice.call(arguments));

  process.stdout.write(colors.green.bold('  gulp-css ') + message + '\n');
}

/**
 * define a readonly property
 * @param object
 * @param prop
 * @param value
 */
function readonlyProperty(object, prop, value) {
  var setting = {
    __proto__: null,
    writable: false,
    enumerable: true,
    configurable: false
  };

  // set value
  if (arguments.length >= 3) {
    setting[value] = value;
  }

  // define property
  Object.defineProperty(object, prop, setting);
}

/**
 * exports module
 */
module.exports.cwd = cwd;
module.exports.colors = colors;
module.exports.debug = debug;
module.exports.normalize = normalize;
module.exports.resolve = resolve;
module.exports.isRelative = isRelative;
module.exports.isAbsolute = isAbsolute;
module.exports.isLocal = isLocal;
module.exports.isOutBound = isOutBound;
module.exports.pathFromCwd = pathFromCwd;
module.exports.throwError = throwError;
module.exports.print = print;
module.exports.extend = require('extend');
module.exports.readonlyProperty = readonlyProperty;
