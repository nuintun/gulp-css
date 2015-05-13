/**
 * Created by nuintun on 2015/5/5.
 */

'use strict';

var util = require('../util');
var rename = require('../rename');
var common = require('../common');

function transport(vinyl, options){
  vinyl.path = rename(vinyl.path, options.rename);

  common.transportCssDeps(vinyl, options);

  return vinyl;
}

/**
 * Exports module.
 */

module.exports = util.plugin('css', transport);
