/**
 * Created by nuintun on 2015/5/5.
 */

'use strict';

var path = require('path');
var rename = require('../rename');
var common = require('../common');
var Plugin = require('../plugin');

/**
 * transport
 * @param vinyl
 * @param options
 * @param next
 * @returns {*}
 */
function transport(vinyl, options, next) {
  vinyl.path = path.join(vinyl.cwd, vinyl.base, rename(vinyl.relative, options.rename));

  common.transportCssDeps(vinyl, options);

  this.push(vinyl);
  next();
}

/**
 * exports module
 */
module.exports = new Plugin('css', transport);
