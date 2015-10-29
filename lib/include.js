/**
 * Created by nuintun on 2015/4/27.
 */

'use strict';

var is = require('is');
var fs = require('fs');
var path = require('path');
var relative = path.relative;
var Vinyl = require('vinyl');
var through = require('through');
var util = require('./util');
var common = require('./common');
var colors = util.colors;
var debug = util.debug;
var async = require('./async');
var transport = require('./transport');

// blank buffer
var BLANK = new Buffer('');

/**
 * include
 * @param options
 * @returns {*}
 */
function include(options){
  var initialized = false;
  var defaults = common.initOptions(options);

  // stream
  return through({ objectMode: true }, function (vinyl, encoding, next){
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
      return next(util.throwError('streaming not supported.'));
    }

    if (!initialized) {
      // debug
      debug('cwd: %s', colors.magenta(util.normalize(util.cwd)));

      initialized = true;
    }

    // catch error
    try {
      // stream
      var stream = this;

      // clone options
      options = util.extend({}, defaults);

      // lock wwwroot
      util.readonlyProperty(options, 'wwwroot');
      // lock plugins
      util.readonlyProperty(options, 'plugins');

      // transport
      transport(vinyl, options, function (vinyl, options){
        var pool = {};
        var pkg = vinyl.package;
        var start = vinyl.clone();
        var end = vinyl.clone();
        var pathFromCwd = util.pathFromCwd(vinyl.path);

        // set start and end file status
        start.startConcat = true;
        start.contents = BLANK;
        end.endConcat = true;
        end.contents = BLANK;

        // clean vinyl
        delete start.package;
        delete end.package;

        // compute include
        options.include = is.fn(options.include)
          ? options.include(pkg.id || null, vinyl.path)
          : options.include;

        // debug
        debug('concat: %s start', colors.magenta(pathFromCwd));
        // push start blank vinyl
        stream.push(start);
        // include dependencies files
        includeDeps.call(stream, vinyl, pool, options, function (){
          // push end blank vinyl
          stream.push(end);

          // free memory
          pool = null;

          // debug
          debug('concat: %s ...ok', colors.magenta(pathFromCwd));
          next();
        });
      });
    } catch (error) {
      // show error message
      util.print(colors.red.bold(error.stack) + '\x07');
      next();
    }
  });
}

/**
 * create a new vinyl
 * @param path
 * @param cwd
 * @param base
 * @returns {Vinyl|null}
 */
function vinylFile(path, cwd, base){
  if (!is.string(path) || !is.string(cwd) || !is.string(base)) return null;

  // file exists
  if (fs.existsSync(path)) {
    return new Vinyl({
      path: path,
      cwd: cwd,
      base: base,
      stat: fs.statSync(path),
      contents: fs.readFileSync(path)
    });
  }

  // file not exists
  util.print('file: %s not exists', colors.yellow(util.pathFromCwd(path)));

  return null;
}

/**
 * walk file
 * @param vinyl
 * @param pool
 * @param options
 * @param done
 */
function walk(vinyl, pool, options, done){
  var stream = this;
  var pkg = vinyl.package;
  var status = pool[vinyl.path];

  /**
   * transport dependence file
   * @param path
   * @param next
   */
  function transform(path, next){
    if (pool.hasOwnProperty(path)) {
      next();
    } else {
      // create a vinyl file
      var child = vinylFile(path, vinyl.cwd, vinyl.base);

      // read file success
      if (child !== null) {
        // debug
        debug('include: %s', colors.magenta(util.pathFromCwd(child.path)));
        // transport file
        transport(child, options, function (child, options){
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
    }
  }

  /**
   * include current file and flush status
   */
  function flush(){
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
    async.series(pkg.include, transform, flush);
  }
}

/**
 * include dependencies file
 * @param vinyl
 * @param pool
 * @param options
 * @param done
 */
function includeDeps(vinyl, pool, options, done){
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
  walk.call(this, vinyl, pool, options, function (){
    // free memory
    pool = null;

    // callback
    done();
  });
}

/**
 * exports module
 */
module.exports = include;
