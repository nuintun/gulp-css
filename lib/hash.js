/**
 * Created by Newton on 2015/5/10.
 */

'use strict';

function hash(stat){
  var mtime = stat.mtime.getTime().toString(16);
  var size = stat.size.toString(16);

  return '"' + size + '-' + mtime + '"';
}

/**
 * exports module.
 */
module.exports = hash;
