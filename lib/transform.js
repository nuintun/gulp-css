/*!
 * transform
 * Version: 0.0.1
 * Date: 2017/05/19
 * https://github.com/nuintun/gulp-css
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/gulp-css/blob/master/LICENSE
 */

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('./util');
var through = require('@nuintun/through');
var gutil = require('@nuintun/gulp-util');

var relative = path.relative;

// blank buffer
var BLANK = Buffer.from ? Buffer.from('') : new Buffer('');

/**
 * transform
 *
 * @param options
 * @returns {Stream}
 */
module.exports = function(options) {
  var initialized = false;
  var configure = util.initOptions(options);

  // stream
  return through({ objectMode: true }, function(vinyl, encoding, next) {
    // hack old vinyl
    vinyl._isVinyl = true;
    // normalize vinyl base
    vinyl.base = relative(vinyl.cwd, vinyl.base);

    // return empty vinyl
    if (vinyl.isNull()) {
      return next(null, vinyl);
    }

    // throw error if stream vinyl
    if (vinyl.isStream()) {
      return next(gutil.throwError('streaming not supported.'));
    }

    if (!initialized) {
      // debug
      util.debug('cwd: %s', gutil.colors.magenta(gutil.normalize(gutil.cwd)));

      initialized = true;
    }

    // catch error
    try {
      // stream
      var stream = this;

      // clone options
      options = gutil.extend({}, configure);

      // lock wwwroot
      gutil.readonlyProperty(options, 'wwwroot');
      // lock plugins
      gutil.readonlyProperty(options, 'plugins');

      // transport
      util.transport(vinyl, options, function(vinyl, options) {
        var pool = {};
        var pkg = vinyl.package;
        var start = vinyl.clone();
        var end = vinyl.clone();
        var pathFromCwd = gutil.pathFromCwd(vinyl.path);

        // set start and end file status
        start.startConcat = true;
        start.contents = BLANK;
        end.endConcat = true;
        end.contents = BLANK;

        // clean vinyl
        delete start.package;
        delete end.package;

        // compute include
        options.include = gutil.isFunction(options.include)
          ? options.include(pkg.id || null, vinyl.path)
          : options.include;

        // debug
        util.debug('concat: %s start', gutil.colors.magenta(pathFromCwd));
        // push start blank vinyl
        stream.push(start);
        // include dependencies files
        includeDeps.call(stream, vinyl, pool, options, function() {
          // push end blank vinyl
          stream.push(end);

          // free memory
          pool = null;

          // debug
          util.debug('concat: %s ...ok', gutil.colors.magenta(pathFromCwd));
          next();
        });
      });
    } catch (error) {
      // show error message
      util.print(gutil.colors.red.bold(error.stack) + '\x07');
      next();
    }
  });
};

/**
 * create a new vinyl
 *
 * @param path
 * @param cwd
 * @param base
 * @returns {Vinyl|null}
 */
function vinylFile(path, cwd, base, done) {
  if (!gutil.isString(path)
    || !gutil.isString(cwd)
    || !gutil.isString(base)) {
    return done(null);
  }

  function printError(error) {
    util.print(
      'file: %s is %s',
      gutil.colors.yellow(gutil.pathFromCwd(path)),
      error.code
    );
  }

  // file exists
  fs.stat(path, function(error, stat) {
    if (error) {
      done(null);

      return printError(error);
    }

    fs.readFile(path, function(error, data) {
      if (error) {
        done(null);

        return printError(error);
      }

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
 * walk file
 * @param vinyl
 * @param pool
 * @param options
 * @param done
 * @returns {void}
 */
function walk(vinyl, pool, options, done) {
  var stream = this;
  var pkg = vinyl.package;
  var status = pool[vinyl.path];

  /**
   * transport dependence file
   *
   * @param path
   * @param next
   * @returns {void}
   */
  function transform(path, next) {
    if (pool.hasOwnProperty(path)) {
      next();
    } else {
      // create a vinyl file
      vinylFile(path, vinyl.cwd, vinyl.base, function(child) {
        // read file success
        if (child !== null) {
          // debug
          util.debug('include: %s', gutil.colors.magenta(gutil.pathFromCwd(child.path)));
          // transport file
          util.transport(child, options, function(child, options) {
            // cache next
            status.next = next;
            // add cache status
            pool[child.path] = {
              next: null,
              parent: status,
              included: false
            };

            // walk
            walk.call(stream, child, pool, options, done);
          });
        } else {
          next();
        }
      });
    }
  }

  /**
   * include current file and flush status
   *
   * @returns {void}
   */
  function flush() {
    // push file to stream
    stream.push(vinyl);

    // all file include
    if (status.parent === null) {
      done();
    } else if (status.parent.next !== null) {
      // run parent next dependencies
      status.parent.next();
    }

    // change cache status
    status.next = null;
    status.included = true;

    // clean parent
    if (status.parent !== null) {
      delete status.parent;
    }
  }

  // bootstrap
  if (status.included || !pkg) {
    flush();
  } else {
    gutil.async.series(pkg.include, transform, flush);
  }
}

/**
 * include dependencies file
 *
 * @param vinyl
 * @param pool
 * @param options
 * @param done
 * @returns {void}
 */
function includeDeps(vinyl, pool, options, done) {
  // return if include not equal 'all' and 'relative'
  if (!options.include) {
    // push file to stream
    this.push(vinyl);

    // free memory
    pool = null;

    // callback
    return done();
  }

  // set pool cache
  pool[vinyl.path] = {
    next: null,
    parent: null,
    included: false
  };

  // bootstrap
  walk.call(this, vinyl, pool, options, function() {
    // free memory
    pool = null;

    // callback
    done();
  });
}