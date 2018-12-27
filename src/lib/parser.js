/**
 * @module parser
 * @license MIT
 * @version 2018/03/30
 */

import lifecycle from './lifecycle';
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

    // Get code
    contents = contents.toString();

    // Execute load hook
    contents = await gutil.pipeline(plugins, lifecycle.moduleDidLoad, path, contents, { root });

    // Parse metadata
    const meta = await packager.parse(path, contents, options);

    // Override contents
    contents = meta.contents.toString();

    // Execute parse hook
    contents = await gutil.pipeline(plugins, lifecycle.moduleDidParse, path, contents, { root });

    // Override dependencies
    dependencies = meta.dependencies;

    // Execute bundle hook
    contents = await gutil.pipeline(plugins, lifecycle.moduleWillBundle, path, contents, { root });

    // To buffer
    contents = Buffer.from(contents);
  }

  return { path, dependencies, contents };
}
