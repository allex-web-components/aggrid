function createUtils (lib) {
  'use strict';

  var mylib = {};
  require('./columndefutilscreator')(lib, mylib);

  return mylib;
}
module.exports = createUtils;