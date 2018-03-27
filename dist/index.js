/**
 * @module @nuintun/gulp-css
 * @author nuintun
 * @license MIT
 * @version 0.1.0
 * @description A gulp plugin for cmd transport and concat
 * @see https://nuintun.github.io/gulp-css
 */

'use strict';

const fs = require('fs');
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
    combine: { type: Boolean, default: true },
    map: { type: [null, Function], default: null },
    onpath: { type: [null, Function], default: null }
  });

  // Init root and base
  options.root = path.resolve(options.root);

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
function resolveDependencyId(dependency, resolved, referer) {
  // Convert absolute path to relative base path
  if (gutil.isAbsolute(dependency)) {
    dependency = path.relative(path.dirname(referer), resolved);
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
function fsSafeAccess(path$$1, mode = fs.constants.R_OK) {
  try {
    fs.accessSync(path$$1, mode);
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
async function loadModule(path$$1, options) {
  // Read module
  const base = options.base;
  const stat = await fsReadStat(path$$1);
  const contents = await fsReadFile(path$$1);

  // Return a vinyl file
  return new gutil.VinylFile({ base, path: path$$1, stat, contents });
}

/**
 * @module css
 * @license MIT
 * @version 2018/03/26
 */

/**
 * @function cssPackager
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @returns {Object}
 */
async function cssPackager(vinyl, options) {
  const root = options.root;
  const referer = vinyl.path;
  const dependencies = new Set();
  const combine = options.combine;

  // Normalize onpath
  const onpath = options.onpath ? (prop, value) => options.onpath(prop, value, referer) : null;

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

        // Resolve dependency
        const resolved = resolve(dependency, referer, { root });

        // Module can read
        if (fsSafeAccess(resolved)) {
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

        // Convert absolute path to relative path
        dependency = resolveDependencyId(dependency, resolved, referer);
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

  const path$$1 = referer;
  const contents = gutil.buffer(meta.code);

  return { path: path$$1, dependencies, contents };
}

/**
 * @module index
 * @license MIT
 * @version 2018/03/26
 */

const packagers = /*#__PURE__*/(Object.freeze || Object)({
  css: cssPackager
});

/**
 * @module bundler
 * @license MIT
 * @version 2018/03/26
 */

/**
 * @function parse
 * @param {Vinyl} vinyl
 * @param {Object} options
 * @returns {Object}
 */
async function parse(vinyl, options) {
  const ext = vinyl.extname.slice(1);
  const packager = packagers[ext.toLowerCase()];

  if (packager) {
    const cacheable = options.combine;
    const meta = await packager(vinyl, options);
    const dependencies = cacheable ? meta.dependencies : new Set();
    const contents = meta.contents;
    const path$$1 = meta.path;

    return { path: path$$1, dependencies, contents };
  }

  return {
    path: vinyl.path,
    dependencies: new Set(),
    contents: vinyl.contents
  };
}

/**
 * @function combine
 * @param {Set} bundles
 * @returns {Buffer}
 */
function combine(bundles) {
  const contents = [];

  // Traverse bundles
  bundles.forEach(bundle => {
    contents.push(bundle.contents);
  });

  // Concat contents
  return Buffer.concat(contents);
}

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
      const isEntryFile = input === path$$1;

      // Hit cache
      if (cacheable && cache.has(path$$1)) {
        meta = cache.get(path$$1);
      } else {
        const file = isEntryFile ? vinyl : await loadModule(path$$1, options);

        // Execute transform hook
        file.contents = await gutil.pipeline(plugins, 'transform', file.path, file.contents, { root, base });

        // Execute parse
        meta = await parse(file, options);

        // Execute bundle hook
        meta.contents = await gutil.pipeline(plugins, 'bundle', meta.path, meta.contents, { root, base });
      }

      // Set cache if combine is true
      if (cacheable) cache.set(path$$1, meta);
      // If is entry file override file path
      if (isEntryFile) vinyl.path = meta.path;

      // Get dependencies and contents
      const dependencies = meta.dependencies;
      const contents = meta.contents;

      // Return meta
      return { dependencies, contents };
    }
  });

  // Combine files
  vinyl.contents = combine(bundles);

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

  const cache = options.cache;
  const cacheable = options.combine;

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

      // Next
      try {
        next(null, await bundler(vinyl, options));
      } catch (error) {
        next(error);
      }
    },
    function(next) {
      // Clear cache
      cache.clear();

      // Next
      next();
    }
  );
}

// Exports
main.chalk = gutil.chalk;
main.logger = gutil.logger;

module.exports = main;
