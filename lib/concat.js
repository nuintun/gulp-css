/**
 * Created by Newton on 2015/5/10.
 */

'use strict';

var through = require('through2');
var util = require('./util');
var debug = util.debug;
var colors = util.colors;

function concat(){
  var code = '';
  var remote = [];
  var imports = '';

  return through.obj({ objectMode: true }, function (vinyl, encoding, next){
    // return empty vinyl
    if (vinyl.isNull()) {
      return next(null, vinyl);
    }

    // throw error if stream vinyl
    if (vinyl.isStream()) {
      return next(util.throwError('streaming not supported.'));
    }

    // package
    var pkg = vinyl.package;

    // remote uri
    if (pkg && Array.isArray(pkg.remote)) {
      pkg.remote.forEach(function (uri){
        if (remote.indexOf(uri) === -1) {
          remote.push(uri);

          // compile remote uri
          imports = '@import ' + JSON.stringify(uri) + ';\n' + imports;
        }
      });
    }

    // start concat
    if (isStart(vinyl)) {
      // debug
      debug('concat: %s start', colors.magenta(util.pathFromCwd(vinyl.path)));

      return next();
    }

    // end concat
    if (isEnd(vinyl)) {
      // debug
      debug('concat: %s ...ok', colors.magenta(util.pathFromCwd(vinyl.path)));

      code += vinyl.contents.toString();
      vinyl.contents = new Buffer(imports + code);

      this.push(vinyl);

      code = '';
      remote = [];
      imports = '';

      return next();
    }

    code += vinyl.contents.toString();

    next();
  });
}

function isStart(vinyl){
  return vinyl.startConcat;
}

function isEnd(vinyl){
  return vinyl.endConcat;
}

/**
 * Exports module.
 */

module.exports = concat;
