/**
 * Created by nuintun on 2015/4/27.
 */

'use strict';

var is = require('is');
var fs = require('fs');
var Vinyl = require('vinyl');
var through = require('through2');
var util = require('./util');
var common = require('./common');
var colors = util.colors;
var transport = require('./transport');
var debug = util.debug;

// empty buffer
var NULL = new Buffer('');

function include(options){
  var initialized = false;
  var defaults = common.initOptions(options);

  // stream
  return through.obj({ objectMode: true }, function (vinyl, encoding, next){
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

      var included = [];
      var start = vinyl.clone();
      var end = vinyl.clone();

      start.startConcat = true;
      start.contents = NULL;
      end.endConcat = true;

      delete start.package;

      this.push(start);
      included.push(start.path);

      includeDeps.call(this, vinyl, options, included);
      this.push(end);
    } catch (e) {
      // show error message
      util.print(colors.red.bold(e.stack) + '\x07');
    }

    next();
  });
}

/**
 * include dependencies file
 * @param vinyl
 * @param options
 * @param included
 */

function includeDeps(vinyl, options, included){
  var stream = this;
  var pkg = vinyl.package;

  // clone options
  options = util.extend({}, options);

  // traverse
  function traverse(path, cwd, base){
    included.push(path);

    var vinyl = vinylFile(path, cwd, base);

    if (vinyl !== null) {
      vinyl = transport(vinyl, options);

      // debug
      debug('include: %s', colors.magenta(util.pathFromCwd(vinyl.path)));
      includeDeps.call(stream, vinyl, options, included);
      stream.push(vinyl);
    }
  }

  if (pkg && Array.isArray(pkg.include)) {
    // dependencies
    pkg.include.forEach(function (path){
      traverse(path, vinyl.cwd, vinyl.base);
    });
  }
}

/**
 * create a new vinyl
 * @param path
 * @param cwd
 * @param base
 * @returns {*}
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
 * Exports module.
 */

module.exports = include;
