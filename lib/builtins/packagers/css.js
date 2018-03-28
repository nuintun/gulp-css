/**
 * @module css
 * @license MIT
 * @version 2018/03/26
 */

import * as utils from '../../utils';
import cssDeps from '@nuintun/css-deps';
import * as gutil from '@nuintun/gulp-util';

/**
 * @function cssPackager
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @returns {Object}
 */
export default async function cssPackager(vinyl, options) {
  const root = options.root;
  const referer = vinyl.path;
  const dependencies = new Set();
  const combine = options.combine;

  /**
   * @function onpath
   * @param {string} prop
   * @param {string} value
   */
  const onpath = (prop, value) => {
    value = gutil.isLocal(value) ? gutil.normalize(value) : value;

    // Returned value
    return options.onpath ? options.onpath(prop, value, referer) : value;
  };

  // Parse module
  const meta = cssDeps(
    vinyl.contents,
    (dependency, media) => {
      if (gutil.isLocal(dependency)) {
        if (media.length) {
          // Get media
          media = JSON.stringify(media.join(', '));

          // Relative file path from cwd
          const rpath = JSON.stringify(gutil.path2cwd(referer));

          // Output warn
          gutil.logger.warn(
            gutil.chalk.yellow(`Found import media queries ${media} at ${rpath}, unsupported.`),
            '\x07'
          );
        }

        // Normalize
        dependency = gutil.normalize(dependency);

        // Resolve dependency
        const resolved = utils.resolve(dependency, referer, { root });

        // Module can read
        if (utils.fsSafeAccess(resolved)) {
          dependencies.add(resolved);
        } else {
          // Relative file path from cwd
          const rpath = JSON.stringify(gutil.path2cwd(referer));

          // Output warn
          gutil.logger.warn(
            gutil.chalk.yellow(`Module ${JSON.stringify(dependency)} at ${rpath} can't be found.`),
            '\x07'
          );
        }

        // Parse map
        dependency = gutil.parseMap(dependency, resolved, options.map);
        dependency = gutil.normalize(dependency);
      } else {
        // Relative file path from cwd
        const rpath = JSON.stringify(gutil.path2cwd(referer));

        // Output warn
        gutil.logger.warn(
          gutil.chalk.yellow(`Found remote css file ${JSON.stringify(dependency)} at ${rpath}, unsupported.`),
          '\x07'
        );
      }

      return combine ? false : dependency;
    },
    { onpath, media: true }
  );

  const path = referer;
  const contents = gutil.buffer(meta.code);

  return { path, dependencies, contents };
}