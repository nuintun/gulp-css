/**
 * Created by nuintun on 2015/5/5.
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
  vinyl.path = path.join(vinyl.cwd, vinyl.base, util.rename(vinyl.relative, options.rename));

  util.transportCssDeps(vinyl, options);

  this.push(vinyl);
  next();
};
