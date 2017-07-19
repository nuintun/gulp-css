/*!
 * concat
 * Version: 0.0.1
 * Date: 2017/05/19
 * https://github.com/nuintun/gulp-css
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/gulp-css/blob/master/LICENSE
 */

'use strict';

var util = require('./util');
var gutil = require('@nuintun/gulp-util');
var through = require('@nuintun/through');

/**
 * concat
 *
 * @returns {Stream}
 */
module.exports = function() {
  var code = [];
  var imports = '';

  return through(function(vinyl, encoding, next) {
    // throw error if stream vinyl
    if (vinyl.isStream()) {
      return next(gutil.throwError('streaming not supported.'));
    }

    // return empty vinyl
    if (vinyl.isNull()) {
      return next(null, vinyl);
    }

    // package
    var pkg = vinyl.package;
    var concat = vinyl.concat;

    // remote uri
    if (pkg && Array.isArray(pkg.remote)) {
      var current = '';

      pkg.remote.forEach(function(uri) {
        // compile remote uri
        current += '@import ' + JSON.stringify(uri) + ';\n';
      });

      imports = current + imports;
    }

    // start concat
    if (concat === gutil.CONCAT_STATUS.START) {
      return next();
    }

    // end concat
    if (concat === gutil.CONCAT_STATUS.END) {
      // has remote imports
      if (imports) {
        code.unshift(new Buffer(imports));
      }

      vinyl.contents = Buffer.concat(code);

      // clean vinyl
      delete vinyl.concat;

      this.push(vinyl);

      code = [];
      imports = '';

      return next();
    }

    // concat
    code.push(vinyl.contents);
    next();
  });
};
