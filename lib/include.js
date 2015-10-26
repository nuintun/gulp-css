/**
 * Created by nuintun on 2015/4/27.
 */

'use strict';

var is = require('is');
var fs = require('fs');
var path = require('path');
var relative = path.relative;
var Vinyl = require('vinyl');
var through = require('through');
var util = require('./util');
var common = require('./common');
var colors = util.colors;
var transport = require('./transport');
var debug = util.debug;

// empty buffer
var NULL = new Buffer('');

/**
 * include
 * @param options
 * @returns {*}
 */
function include(options){
  var initialized = false;
  var defaults = common.initOptions(options);

  // stream
  return through({ objectMode: true }, function (vinyl, encoding, next){
    // hack old vinyl
    vinyl._isVinyl = true;
    // normalize vinyl base
    vinyl.base = relative(vinyl.cwd, vinyl.base);

    // return empty vinyl
    if (vinyl.isNull()) {
      return next(null, vinyl);
    }

    // throw error if stream vinyl
    if (vinyl.isStream()) {
      return next(util.throwError('streaming not supported.'));
    }

    if (!initialized) {
      // debug
      debug('cwd: %s', colors.magenta(util.normalize(util.cwd)));

      initialized = true;
    }

    // catch error
    try {
      // clone options
      options = util.extend({}, defaults);

      // lock wwwroot
      Object.defineProperty(options, 'wwwroot', {
        __proto__: null,
        writable: false,
        enumerable: true,
        configurable: false
      });

      // transport
      vinyl = transport(vinyl, options);

      var included = {};
      var start = vinyl.clone();
      var end = vinyl.clone();

      start.startConcat = true;
      start.contents = NULL;
      end.endConcat = true;

      delete start.package;

      this.push(start);
      included[start.path] = true;

      includeDeps.call(this, vinyl, included, options);
      this.push(end);
    } catch (error) {
      // show error message
      util.print(colors.red.bold(error.stack) + '\x07');
    }

    next();
  });
}

/**
 * traverse
 * @param path
 * @param cwd
 * @param base
 * @param included
 * @param options
 */
function traverse(path, cwd, base, included, options){
  var stream = this;
  var vinyl = vinylFile(path, cwd, base);

  // read file ok
  if (vinyl !== null) {
    // debug
    debug('include: %s', colors.magenta(util.pathFromCwd(vinyl.path)));

    included[path] = true;
    vinyl = transport(vinyl, options);

    includeDeps.call(stream, vinyl, included, options);
    stream.push(vinyl);
  } else {
    // debug
    debug('include: %s failed', colors.yellow(util.pathFromCwd(path)));
  }
}

/**
 * include dependencies file
 * @param vinyl
 * @param included
 * @param options
 */
function includeDeps(vinyl, included, options){
  // return if include is false
  if (!options.include) return;

  var stream = this;
  var pkg = vinyl.package;

  // clone options
  options = util.extend({}, options);

  if (pkg && Array.isArray(pkg.include)) {
    // dependencies
    pkg.include.forEach(function (path){
      // included
      if (included[path]) {
        return false;
      }

      // include all files
      traverse.call(stream, path, vinyl.cwd, vinyl.base, included, options);
    });
  }
}

/**
 * create a new vinyl
 * @param path
 * @param cwd
 * @param base
 * @returns {Vinyl|null}
 */
function vinylFile(path, cwd, base){
  if (!is.string(path) || !is.string(cwd) || !is.string(base)) return null;

  var origin = path;

  if (!fs.existsSync(path)) {
    path = util.hideExt(path);
  }

  if (fs.existsSync(path)) {
    return new Vinyl({
      path: path,
      cwd: cwd,
      base: base,
      stat: fs.statSync(path),
      contents: fs.readFileSync(path)
    });
  }

  // file not exists
  util.print('file: %s not exists', colors.yellow(util.pathFromCwd(origin)));

  return null;
}

/**
 * exports module
 */
module.exports = include;
