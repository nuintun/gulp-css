/**
 * @module parser
 * @license MIT
 * @version 2018/03/30
 */

import * as utils from './utils';
import * as gutil from '@nuintun/gulp-util';
import * as packagers from './builtins/packagers/index';

/**
 * @function parser
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @returns {Object}
 */
export default async function parser(vinyl, options) {
  let path = vinyl.path;
  let dependencies = new Set();
  let contents = vinyl.contents;

  const ext = vinyl.extname.slice(1).toLowerCase();
  const packager = packagers[ext];

  if (packager) {
    const root = options.root;
    const plugins = options.plugins;
    const combine = options.combine;

    // Get code
    contents = contents.toString();

    // Execute load hook
    contents = await gutil.pipeline(plugins, 'loaded', path, contents, { root });

    // Parse metadata
    const meta = await packager.parse(path, contents, options);

    // Override contents
    contents = meta.contents;

    // Execute transform hook
    contents = await gutil.pipeline(plugins, 'parsed', path, contents, { root });

    // Override dependencies
    if (combine(path)) dependencies = meta.dependencies;

    // To buffer
    contents = gutil.buffer(contents);
  }

  return { path, dependencies, contents };
}
