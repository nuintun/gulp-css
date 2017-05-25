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

/**
 * transport
 *
 * @param vinyl
 * @param options
 * @param next
 * @returns {void}
 */
module.exports = function transport(vinyl, options, next) {
  vinyl.path = path.join(
    vinyl.cwd,
    vinyl.base,
    util.rename(vinyl.relative, options.rename)
  );

  util.transportId(vinyl, options);
  util.transportCssDeps(vinyl, options);
  next(null, vinyl);
};
