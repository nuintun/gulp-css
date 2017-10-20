/*!
 * plugins/css
 *
 * Date: 2017/05/19
 * https://github.com/nuintun/gulp-css
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/gulp-css/blob/master/LICENSE
 */

'use strict';

var path = require('path');
var util = require('../util');

/**
 * loader
 *
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @returns {Vinyl|Promise}
 */
module.exports = function(vinyl, options) {
  util.transportId(vinyl, options);
  util.transportCssDeps(vinyl, options);

  return vinyl;
};
