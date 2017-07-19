/*!
 * plugins/css
 * Version: 0.0.1
 * Date: 2017/05/19
 * https://github.com/nuintun/gulp-css
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/gulp-css/blob/master/LICENSE
 */

'use strict';

var path = require('path');
var util = require('../util');
var through = require('@nuintun/through');

/**
 * loader
 *
 * @param options
 * @returns {Stream}
 */
module.exports = function(options) {
  return through(function(vinyl, encoding, next) {
    util.transportId(vinyl, options);
    util.transportCssDeps(vinyl, options);

    next(null, vinyl);
  });
};
