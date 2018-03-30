/**
 * @module utils
 * @license MIT
 * @version 2018/03/26
 */

import * as gutil from '@nuintun/gulp-util';
import { resolve as pResolve, join, dirname, relative } from 'path';

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
  const cwd = process.cwd();

  // Init attrs
  options = gutil.inspectAttrs(options, {
    root: { type: String, default: cwd },
    plugins: { type: Array, default: [] },
    combine: { type: Boolean, default: false },
    map: { type: [null, Function], default: null },
    onpath: { type: [null, Function], default: null }
  });

  // Init root and base
  options.root = pResolve(options.root);

  // Init cache
  options.cache = new Map();

  // Freeze
  return Object.freeze(options);
}
