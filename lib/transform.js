/**
 * @module transform
 * @license MIT
 * @version 2017/11/13
 */

'use strict';

const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const through = require('@nuintun/through');
const gutil = require('@nuintun/gulp-util');

const relative = path.relative;

/**
 * @function transform
 * @param {Object} options
 * @returns {Stream}
 */
module.exports = function(options) {
  const configure = utils.initOptions(options);

  // Debug
  utils.debug('cwd: %p', gutil.normalize(gutil.cwd));

  // Stream
  return through((vinyl, encoding, next) => {
    vinyl = gutil.wrapVinyl(vinyl);

    // Throw error if stream vinyl
    if (vinyl.isStream()) {
      return next(gutil.throwError('streaming not supported.'));
    }

    // Return empty vinyl
    if (vinyl.isNull()) {
      return next(null, vinyl);
    }

    const path = gutil.pathFromCwd(vinyl.path);

    // Clone options
    options = gutil.extend(true, {}, configure);

    // Lock wwwroot
    gutil.readonlyProperty(options, 'wwwroot');
    // Lock plugins
    gutil.readonlyProperty(options, 'plugins');

    // Transport
    utils.transport(vinyl, options, (error, vinyl, options) => {
      // Show error message
      if (error) {
        utils.print(gutil.chalk.reset.red.bold(gutil.inspectError(error)) + '\x07');
      }

      const pool = {};
      const pkg = vinyl.package;
      const start = gutil.blankVinyl(vinyl);
      const end = gutil.blankVinyl(vinyl);

      // Set start and end file status
      start.concat = gutil.CONCAT_STATUS.START;
      end.concat = gutil.CONCAT_STATUS.END;

      // Compute include
      options.include = gutil.isFunction(options.include)
        ? options.include(pkg.id || null, vinyl.path)
        : options.include;

      // Debug
      utils.debug('concat: %p start', path);
      // Push start blank vinyl
      this.push(start);
      // Include dependencies files
      includeDeps.call(this, vinyl, pool, options, () => {
        // Push end blank vinyl
        this.push(end);

        // Free memory
        pool = null;

        // Debug
        utils.debug('concat: %p ...ok', path);
        next();
      });
    });
  });
};

/**
 * @function vinylFile
 * @description Create a new vinyl
 * @param {string} path
 * @param {string} cwd
 * @param {string} base
 * @param {Function} done
 * @param {Function} fail
 */
function vinylFile(path, cwd, base, done, fail) {
  // Read file
  fs.stat(path, (error, stat) => {
    if (error) return fail(error);

    fs.readFile(path, (error, data) => {
      if (error) return fail(error);

      done(new gutil.Vinyl({
        path: path,
        cwd: cwd,
        base: base,
        stat: stat,
        contents: data
      }));
    });
  });
}

/**
 * @function walk
 * @description Walk file
 * @param {Vinyl} vinyl
 * @param {Object} pool
 * @param {Object} options
 * @param {Function} done
 */
function walk(vinyl, pool, options, done) {
  const status = pool[vinyl.path];

  /**
   * @function transform
   * @description Transport dependence file
   * @param {Object} module
   * @param {Function} next
   */
  const transform = (module, next) => {
    const path = module.path;

    // Already transport
    if (pool[path]) return next();

    // Create a vinyl file
    vinylFile(path, gutil.cwd, vinyl.base, (child) => {
      // Debug
      utils.debug('include: %r', child.path);
      // Transport file
      utils.transport(child, options, (error, child, options) => {
        // Show error message
        if (error) {
          utils.print(gutil.chalk.reset.red.bold(gutil.inspectError(error)) + '\x07');
        }

        // Cache next
        status.next = next;
        // Add cache status
        pool[child.path] = {
          next: null,
          parent: status,
          included: false
        };

        // Walk
        walk.call(this, child, pool, options, done);
      });
    }, (error) => {
      utils.print(
        'module: %s in %s is %s',
        gutil.chalk.reset.yellow.bold(module.id),
        gutil.chalk.reset.yellow.bold(gutil.pathFromCwd(vinyl.path)),
        error.code
      );

      next();
    });
  }

  /**
   * @function flush
   * @description Include current file and flush status
   */
  const flush = () => {
    // Push file to stream
    if (!status.included) {
      this.push(vinyl);

      // Change cache status
      status.next = null;
      status.included = true;
    }

    const parent = status.parent;

    // All file include
    if (parent === null || parent.next === null) {
      done();
    } else {
      // Run parent next dependencies
      parent.next();

      // Clean parent
      delete status.parent;
    }
  }

  const pkg = vinyl.package;

  // Bootstrap
  if (status.included || !pkg) {
    flush();
  } else {
    gutil.async.series(pkg.include, transform, flush);
  }
}

/**
 * @function includeDeps
 * @description Include dependencies file
 *
 * @param vinyl
 * @param pool
 * @param options
 * @param done
 * @returns {void}
 */
function includeDeps(vinyl, pool, options, done) {
  // Return if include not equal 'all' and 'relative'
  if (!options.include) {
    // Push file to stream
    this.push(vinyl);

    // Free memory
    pool = null;

    // Callback
    return done();
  }

  // Set pool cache
  pool[vinyl.path] = {
    next: null,
    parent: null,
    included: false
  };

  // Bootstrap
  walk.call(this, vinyl, pool, options, () => {
    // Free memory
    pool = null;

    // Callback
    done();
  });
}
