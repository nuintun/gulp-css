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
      // transport
      vinyl = transport(vinyl, options);

      var included = [];
      var startVinyl = vinyl.clone();
      var endVinyl = vinyl.clone();

      startVinyl.concatOpen = true;
      startVinyl.contents = NULL;
      endVinyl.concatClose = true;

      this.push(startVinyl);
      included.push(startVinyl.path);

      includeDeps.call(this, vinyl, options, included);
      this.push(endVinyl);
    } catch (e) {
      var message = colors.green.bold('  gulp-css ') + colors.red.bold(e.stack);

      // show error message
      console.log(message);
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
  var include = options.include;

  // return if include only self
  if (include === 'self') return;

  // clone options
  options = util.extend({}, options);

  // traverse
  function traverse(path, base){
    included.push(path);

    var vinyl = vinylFile(path, base);

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
      traverse(path, vinyl);
    });
  }
}

/**
 * create a new vinyl
 * @param path
 * @param vinyl
 * @returns {*}
 */

function vinylFile(path, vinyl){
  if (!is.string(path) || !vinyl) return null;

  if (!fs.existsSync(path)) {
    path = util.hideExt(path);
  }

  if (fs.existsSync(path)) {
    return new Vinyl({
      path: path,
      cwd: vinyl.cwd,
      base: vinyl.base,
      stat: fs.statSync(path),
      contents: fs.readFileSync(path)
    });
  }

  debug('file: %s not exists', colors.yellow(util.pathFromCwd(path)));

  return null;
}

/**
 * Exports module.
 */

module.exports = include;
