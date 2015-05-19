/**
 * Created by nuintun on 2015/4/27.
 */

'use strict';

var is = require('is');
var css = require('css');
var path = require('path');
var join = path.join;
var rename = require('./rename');
var cdeps = require('./css-deps');
var util = require('./util');
var debug = util.debug;
var colors = util.colors;

/**
 * Transport css dependencies.
 * - vinyl: vinyl object
 */

function transportCssDeps(vinyl, options){
  var deps = [];
  var remote = [];
  var include = [];
  var pkg = vinyl.package || {};
  var onpath = options.onpath;
  var prefix = options.prefix;

  // init css settings
  onpath = is.fn(onpath) ? function (path, property){
    return options.onpath(path, property, pkg.id || null, vinyl.path);
  } : null;
  prefix = is.fn(prefix) ? prefix(pkg.id || null, vinyl.path) : prefix;

  // replace imports and collect dependencies
  vinyl.contents = new Buffer(cdeps(vinyl.contents, function (id){
    var path;

    // id is not a local file
    if (!util.isLocal(id)) {
      // cache dependencie id
      deps.push(id);
      remote.push(id);

      // keep import
      return false;
    }

    // normalize id
    id = util.normalize(id);

    // if end with /, find index file
    if (id.substring(id.length - 1) === '/') {
      id += 'index.css';
    }

    // set path
    path = id;
    // rename id
    id = rename(path, options.rename);

    // normalize id
    id = util.normalize(id);

    // debug
    debug('transport deps: %s', colors.magenta(id));

    // get absolute path
    path = util.resolve(path, vinyl, options.wwwroot);

    // cache dependencie id
    deps.push(id);
    // cache dependencie absolute path
    include.push(path);

    // delete all import
    return false;
  }, {
    prefix: prefix,
    onpath: onpath,
    compress: options.compress
  }));

  // Cache file dependencies
  vinyl.package = util.extend(pkg, {
    remote: remote,
    include: include,
    dependencies: deps
  });

  return deps;
}

/**
 * Get rename options
 * @param transform
 * @returns {*}
 */

function initRenameOptions(transform){
  if (is.fn(transform)) {
    return transform;
  }

  transform = transform || {};

  if (transform.min) {
    transform.suffix = '-min';
  }

  if (transform.debug) {
    transform.suffix = '-debug';
  }

  return transform;
}

/**
 * Init options
 * @param options
 * @returns {object}
 */

function initOptions(options){
  var defaults = {
    prefix: null, // css prefix
    onpath: null, // css resource path callback
    cache: true, // use memory file cahe
    wwwroot: '', // web root
    rename: null, // { debug: boolean, min: boolean }
    compress: false // compress css code
  };

  // mix
  util.extend(true, defaults, options);

  if (defaults.wwwroot && !is.string(defaults.wwwroot)) {
    util.throwError('options.wwwroot\'s value should be string.');
  }

  // init wwwroot
  defaults.wwwroot = join(util.cwd, defaults.wwwroot);
  // init rename
  defaults.rename = initRenameOptions(defaults.rename);

  return defaults;
}

/**
 * Exports module.
 */

exports.initOptions = initOptions;
exports.transportCssDeps = transportCssDeps;
