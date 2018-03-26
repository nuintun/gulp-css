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
  const referer = vinyl.path;
  const combine = options.combine;

  /**
   * @function onpath
   * @param {string} value
   * @param {string} prop
   */
  const onpath = (prop, value) => {
    if (options.onpath) {
      options.onpath(prop, value, referer);
    }
  };

  const meta = cssDeps(
    vinyl.contents,
    (dependency, media) => {
      if (gutil.isLocal(dependency)) {
        // Resolve dependency
        let resolved = utils.resolve(dependency, referer, { root });

        // Module can read
        if (utils.fsSafeAccess(resolved)) {
          !ignore.has(resolved) && dependencies.add(resolved);
        } else {
          // Relative file path from cwd
          const rpath = JSON.stringify(gutil.path2cwd(referer));

          // Output warn
          gutil.logger.warn(
            gutil.chalk.yellow(`Module ${JSON.stringify(dependency)} at ${rpath} can't be found.`),
            '\x07'
          );
        }

        // Convert absolute path to relative path
        dependency = utils.resolveDependencyId(dependency, resolved, referer);
        dependency = gutil.normalize(dependency);
      } else {
        // Resolve dependency
        dependency = utils.resolve(dependency, referer, { root });
      }

      return combine ? false : dependency;
    },
    { onpath, media: true }
  );

  if (deps.size > 1) requires += '\n';

  const path = utils.addExt(referer);

  return { path, dependencies, contents };
}
