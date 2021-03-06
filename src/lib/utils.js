/**
 * @module utils
 * @license MIT
 * @version 2018/03/26
 */

import * as gutil from '@nuintun/gulp-util';
import optionsSchemas from '../schemas/options';
import { resolve as pResolve, join, dirname } from 'path';

/**
 * @function resolve
 * @description Resolve a request path
 * @param {string} request
 * @param {string} referer
 * @param {Object} options
 * @returns {string}
 */
export function resolve(request, referer, options) {
  const root = options.root;

  if (gutil.isAbsolute(request)) {
    request = join(root, request);
  } else {
    request = join(dirname(referer), request);

    if (gutil.isOutBounds(request, root)) {
      throw new RangeError(`File ${gutil.normalize(request)} is out of bounds of root.`);
    }
  }

  return request;
}

/**
 * @function initOptions
 * @param {Object} options
 * @returns {Object}
 */
export function initOptions(options) {
  // Init attrs
  gutil.validateOptions(optionsSchemas, options, 'gulp-css');

  // Init root and base
  options.root = pResolve(options.root);

  // Init files cache
  options.cache = new Map();

  // Init combine
  const combine = options.combine;
  const fnCombine = gutil.typpy(combine, Function);

  options.combine = module => (fnCombine ? combine(module) : combine);

  // Freeze
  return Object.freeze(options);
}
