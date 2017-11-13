/**
 * @module css
 * @license MIT
 * @version 2017/11/13
 */

'use strict';

const path = require('path');
const utils = require('../utils');

/**
 * @function loader
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @returns {Vinyl|Promise}
 */
module.exports = function(vinyl, options) {
  utils.transportId(vinyl, options);
  utils.transportCssDeps(vinyl, options);

  return vinyl;
};
