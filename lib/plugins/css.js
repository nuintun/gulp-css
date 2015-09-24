/**
 * Created by nuintun on 2015/5/5.
 */

'use strict';

var path = require('path');
var util = require('../util');
var rename = require('../rename');
var common = require('../common');

function transport(vinyl, options){
  vinyl.path = path.join(vinyl.cwd, vinyl.base, rename(vinyl.relative, options.rename));

  common.transportCssDeps(vinyl, options);

  return vinyl;
}

/**
 * exports module.
 */
module.exports = util.plugin('css', transport);
