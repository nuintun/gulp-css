/**
 * @module css
 * @license MIT
 * @version 2018/03/26
 */

import * as utils from '../../utils';
import cssDeps from '@nuintun/css-deps';
import * as gutil from '@nuintun/gulp-util';

/**
 * @namespace cssPackager
 */
export default {
  /**
   * @method parse
   * @param {string} path
   * @param {string} contents
   * @param {Object} options
   * @returns {Object}
   */
  parse(path, contents, options) {
    const root = options.root;
    const dependencies = new Set();
    const combine = options.combine;

    /**
     * @function onpath
     * @param {string} prop
     * @param {string} value
     */
    const onpath = (prop, value) => {
      value = gutil.isUrl(value) ? value : gutil.normalize(value);

      // Get onpath
      const onpath = options.onpath;

      // Returned value
      return onpath ? onpath(prop, value, path) : value;
    };

    // Parse module
    const meta = cssDeps(
      contents,
      (dependency, media) => {
        if (gutil.isUrl(dependency)) {
          // Relative file path from cwd
          const rpath = JSON.stringify(gutil.path2cwd(path));

          // Output warn
          gutil.logger.warn(
            gutil.chalk.yellow(`Found remote css file ${JSON.stringify(dependency)} at ${rpath}, unsupported.`),
            '\x07'
          );
        } else {
          if (media.length) {
            // Get media
            media = JSON.stringify(media.join(', '));

            // Relative file path from cwd
            const rpath = JSON.stringify(gutil.path2cwd(path));

            // Output warn
            gutil.logger.warn(
              gutil.chalk.yellow(`Found import media queries ${media} at ${rpath}, unsupported.`),
              '\x07'
            );
          }

          // Normalize
          dependency = gutil.normalize(dependency);

          // Resolve dependency
          const resolved = utils.resolve(dependency, path, { root });

          // Module can read
          if (gutil.fsSafeAccess(resolved)) {
            dependencies.add(resolved);
          } else {
            // Relative file path from cwd
            const rpath = JSON.stringify(gutil.path2cwd(path));

            // Output warn
            gutil.logger.warn(
              gutil.chalk.yellow(`Module ${JSON.stringify(dependency)} at ${rpath} can't be found.`),
              '\x07'
            );
          }

          // Parse map
          dependency = gutil.parseMap(dependency, resolved, options.map);
          dependency = gutil.normalize(dependency);
        }

        return combine ? false : dependency;
      },
      { onpath, media: true }
    );

    // Get contents
    contents = meta.code;

    return { dependencies, contents };
  }
};
