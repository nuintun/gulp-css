/**
 * @module utils
 * @license MIT
 * @version 2018/03/26
 */

import fs from 'fs';
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
    combine: { type: Boolean, default: true },
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

/**
 * @function resolveDependencyId
 * @param {string} dependency
 * @param {string} resolved
 * @param {string} referer
 * @returns {string}
 */
export function resolveDependencyId(dependency, resolved, referer) {
  // Convert absolute path to relative base path
  if (gutil.isAbsolute(dependency)) {
    dependency = relative(referer, resolved);
  }

  // Normalize
  dependency = gutil.normalize(dependency);

  return dependency;
}

// Promisify stat and readFile
const fsReadStat = gutil.promisify(fs.stat);
const fsReadFile = gutil.promisify(fs.readFile);

/**
 * @function fsSafeAccess
 * @param {string} path
 * @param {Number} mode
 * @returns {boolean}
 */
export function fsSafeAccess(path, mode = fs.constants.R_OK) {
  try {
    fs.accessSync(path, mode);
  } catch (error) {
    return false;
  }

  return true;
}

/**
 * @function loadModule
 * @param {string} path
 * @param {Object} options
 * @returns {Vinyl}
 */
export async function loadModule(path, options) {
  // Read module
  const base = options.base;
  const stat = await fsReadStat(path);
  const contents = await fsReadFile(path);

  // Return a vinyl file
  return new gutil.VinylFile({ base, path, stat, contents });
}
