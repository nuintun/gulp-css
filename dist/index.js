/**
 * @module @nuintun/gulp-css
 * @author nuintun
 * @license MIT
 * @version 0.2.0
 * @description A gulp plugin for cmd transport and concat.
 * @see https://github.com/nuintun/gulp-css#readme
 */

'use strict';

const gutil = require('@nuintun/gulp-util');
const path = require('path');
const cssDeps = require('@nuintun/css-deps');
const Bundler = require('@nuintun/bundler');
const through = require('@nuintun/through');

/**
 * @module utils
 * @license MIT
 * @version 2018/03/26
 */

/**
 * @function resolve
 * @description Resolve a request path
 * @param {string} request
 * @param {string} referer
 * @param {Object} options
 * @returns {string}
 */
function resolve(request, referer, options) {
  const root = options.root;

  if (gutil.isAbsolute(request)) {
    request = path.join(root, request);
  } else {
    request = path.join(path.dirname(referer), request);

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
function initOptions(options) {
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
  options.root = path.resolve(options.root);

  // Init files cache
  options.cache = new Map();

  // Freeze
  return Object.freeze(options);
}

/**
 * @module css
 * @license MIT
 * @version 2018/03/26
 */

/**
 * @namespace cssPackager
 */
const css = {
  /**
   * @method parse
   * @param {string} path
   * @param {string} contents
   * @param {Object} options
   * @returns {Object}
   */
  parse(path$$1, contents, options) {
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
      return onpath ? onpath(prop, value, path$$1) : value;
    };

    // Parse module
    const meta = cssDeps(
      contents,
      (dependency, media) => {
        if (gutil.isUrl(dependency)) {
          // Relative file path from cwd
          const rpath = JSON.stringify(gutil.path2cwd(path$$1));

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
            const rpath = JSON.stringify(gutil.path2cwd(path$$1));

            // Output warn
            gutil.logger.warn(
              gutil.chalk.yellow(`Found import media queries ${media} at ${rpath}, unsupported.`),
              '\x07'
            );
          }

          // Normalize
          dependency = gutil.normalize(dependency);

          // Resolve dependency
          const resolved = resolve(dependency, path$$1, { root });

          // Module can read
          if (gutil.fsSafeAccess(resolved)) {
            dependencies.add(resolved);
          } else {
            // Relative file path from cwd
            const rpath = JSON.stringify(gutil.path2cwd(path$$1));

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

/**
 * @module index
 * @license MIT
 * @version 2018/03/26
 */

const packagers = /*#__PURE__*/(Object.freeze || Object)({
  css: css
});

/**
 * @module parser
 * @license MIT
 * @version 2018/03/30
 */

/**
 * @function parser
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @returns {Object}
 */
async function parser(vinyl, options) {
  let path$$1 = vinyl.path;
  let dependencies = new Set();
  let contents = vinyl.contents;

  const ext = vinyl.extname.slice(1).toLowerCase();
  const packager = packagers[ext];

  if (packager) {
    const root = options.root;
    const plugins = options.plugins;
    const cacheable = options.combine;

    // Get code
    contents = contents.toString();

    // Execute load hook
    contents = await gutil.pipeline(plugins, 'loaded', path$$1, contents, { root });

    // Parse metadata
    const meta = await packager.parse(path$$1, contents, options);

    // Override contents
    contents = meta.contents;

    // Execute transform hook
    contents = await gutil.pipeline(plugins, 'parsed', path$$1, contents, { root });

    // Override dependencies
    if (cacheable) dependencies = meta.dependencies;

    // To buffer
    contents = gutil.buffer(contents);
  }

  return { path: path$$1, dependencies, contents };
}

/**
 * @module bundler
 * @license MIT
 * @version 2018/03/26
 */

/**
 * @function bundler
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @returns {Vinyl}
 */
async function bundler(vinyl, options) {
  const input = vinyl.path;
  const root = options.root;
  const base = options.base;
  const cache = options.cache;
  const plugins = options.plugins;
  const cacheable = options.combine;

  // Bundler
  const bundles = await new Bundler({
    input,
    resolve: path$$1 => path$$1,
    parse: async path$$1 => {
      let meta;
      // Is entry file
      const entry = input === path$$1;

      // Hit cache
      if (cacheable && cache.has(path$$1)) {
        meta = cache.get(path$$1);
      } else {
        const file = entry ? vinyl : await gutil.fetchModule(path$$1, options);

        // Execute parser
        meta = await parser(file, options);
      }

      // If is entry file override file path
      if (entry) vinyl.path = meta.path;
      // Set cache if combine is true
      if (cacheable) cache.set(path$$1, meta);

      // Return meta
      return meta;
    }
  });

  // Combine files
  vinyl.contents = gutil.combine(bundles);

  return vinyl;
}

/**
 * @module index
 * @license MIT
 * @version 2018/03/26
 */

/**
 * @function main
 * @param {Object} options
 */
function main(options) {
  options = initOptions(options);

  // Stream
  return through(
    async function(vinyl, encoding, next) {
      vinyl = gutil.VinylFile.wrap(vinyl);

      // Throw error if stream vinyl
      if (vinyl.isStream()) {
        return next(new TypeError('Streaming not supported.'));
      }

      // Return empty vinyl
      if (vinyl.isNull()) {
        return next(null, vinyl);
      }

      // Bundler
      try {
        vinyl = await bundler(vinyl, options);
      } catch (error) {
        return next(error);
      }

      // Next
      next(null, vinyl);
    },
    function(next) {
      // Clear cache
      options.cache.clear();

      // Next
      next();
    }
  );
}

// Exports
main.chalk = gutil.chalk;
main.logger = gutil.logger;

module.exports = main;
