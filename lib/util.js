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

// The work cwd
var cwd = process.cwd();

// Set debug color use 6
debug.color = 2;

/**
 * Create a plugin
 * @param name
 * @param transport
 * @returns {Function}
 */

function plugin(name, transport){
  return function (vinyl, options){
    // debug
    debug('load plugin: %s', colors.cyan(name));
    // debug
    debug('read file: %s', colors.magenta(pathFromCwd(vinyl.path)));

    vinyl = transport(vinyl, options);

    return vinyl;
  };
}

/**
 * Normalize path
 * @param path
 * @returns {string}
 */

function normalize(path){
  path = path.replace(/\\+/g, '/');
  path = path.replace(/([^:/])\/+\//g, '$1/');
  path = path.replace(/(:)?\/{2,}/, '$1//');

  return path;
}

/**
 * Resolve a `relative` path base on `base` path
 * @param relative
 * @param vinyl
 * @param wwwroot
 * @returns {string}
 */

function resolve(relative, vinyl, wwwroot){
  var base;
  var absolute;

  // debug
  debug('resolve path: %s', colors.magenta(normalize(relative)));

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
      if (isRelative(absolute)) {
        throwError('file: %s is out of bound of wwwroot: %s.', normalize(absolute), normalize(base));
      }
    }
  }

  // debug
  debug('of base path: %s', colors.magenta(pathFromCwd(base)));
  debug('to: %s', colors.magenta(pathFromCwd(absolute)));

  return absolute;
}

/**
 * Test path is relative path or not
 * @param path
 * @returns {boolean}
 */

function isRelative(path){
  return /^\.{1,2}[\\/]/.test(path);
}

/**
 * Test path is absolute path or not
 * @param path
 * @returns {boolean}
 */

function isAbsolute(path){
  return /^[\\/](?:[^\\/]+|$)/.test(path);
}

/**
 * Test path is local path or not
 * @param path
 * @returns {boolean}
 */

function isLocal(path){
  return !/^https?:\/\/|^\/\//.test(path) && !/^data:/.test(path);
}

/**
 * Get relative path from cwd
 * @param path
 * @returns {string}
 */

function pathFromCwd(path){
  return normalize(relative(cwd, path));
}

/**
 * Plugin error
 */

function throwError(){
  var slice = [].slice;
  var message = util.format
    .apply(null, slice.call(arguments));

  throw new Error(message);
}

/**
 * Node extend
 * Copyright 2011, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * @fileoverview
 * Port of jQuery.extend that actually works on node.js
 */

function extend(){
  var target = arguments[0] || {};
  var i = 1;
  var length = arguments.length;
  var deep = false;
  var options, name, src, copy, copy_is_array, clone;

  // handle a deep copy situation
  if (typeof target === 'boolean') {
    deep = target;
    target = arguments[1] || {};
    // skip the boolean and the target
    i = 2;
  }

  // handle case when target is a string or something (possible in deep copy)
  if (typeof target !== 'object' && !is.fn(target)) {
    target = {};
  }

  for (; i < length; i++) {
    // only deal with non-null/undefined values
    options = arguments[i];

    if (options !== null) {
      if (typeof options === 'string') {
        options = options.split('');
      }

      // extend the base object
      for (name in options) {
        if (options.hasOwnProperty(name)) {
          src = target[name];
          copy = options[name];

          // prevent never-ending loop
          if (target === copy) {
            continue;
          }

          // recurse if we're merging plain objects or arrays
          if (deep && copy && (is.hash(copy) || (copy_is_array = Array.isArray(copy)))) {
            if (copy_is_array) {
              copy_is_array = false;
              clone = src && Array.isArray(src) ? src : [];
            } else {
              clone = src && is.hash(src) ? src : {};
            }

            // never move original objects, clone them
            target[name] = extend(deep, clone, copy);

            // don't bring in undefined values
          } else if (typeof copy !== 'undefined') {
            target[name] = copy;
          }
        }
      }
    }
  }

  // return the modified object
  return target;
}

/**
 * Exports module.
 */

module.exports.cwd = cwd;
module.exports.normalize = normalize;
module.exports.isRelative = isRelative;
module.exports.isAbsolute = isAbsolute;
module.exports.isLocal = isLocal;
module.exports.resolve = resolve;
module.exports.pathFromCwd = pathFromCwd;
module.exports.throwError = throwError;
module.exports.extend = extend;
module.exports.colors = colors;
module.exports.debug = debug;
module.exports.plugin = plugin;
