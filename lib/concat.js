/**
 * Created by nuintun on 2015/5/10.
 */

'use strict';

var util = require('./util');
var gutil = require('@nuintun/gulp-util');
var through = require('@nuintun/through');

/**
 * concat
 * @returns {*}
 */
function concat() {
  var code = [];
  var imports = '';

  return through({ objectMode: true }, function(vinyl, encoding, next) {
    // return empty vinyl
    if (vinyl.isNull()) {
      return next(null, vinyl);
    }

    // throw error if stream vinyl
    if (vinyl.isStream()) {
      return next(gutil.throwError('streaming not supported.'));
    }

    // package
    var pkg = vinyl.package;

    // remote uri
    if (pkg && gutil.isArray(pkg.remote)) {
      var current = '';

      pkg.remote.forEach(function(uri) {
        // compile remote uri
        current += '@import ' + JSON.stringify(uri) + ';\n';
      });

      imports = current + imports;
    }

    // start concat
    if (isStart(vinyl)) {
      return next();
    }

    // end concat
    if (isEnd(vinyl)) {
      // has remote imports
      if (imports) {
        code.unshift(new Buffer(imports));
      }

      vinyl.contents = Buffer.concat(code);

      this.push(vinyl);

      code = [];
      imports = '';

      return next();
    }

    // concat
    code.push(vinyl.contents);
    next();
  });
}

function isStart(vinyl) {
  return vinyl.startConcat;
}

function isEnd(vinyl) {
  return vinyl.endConcat;
}

/**
 * exports module
 */
module.exports = concat;
