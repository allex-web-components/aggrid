function createUtils (lib) {
  'use strict';

  var mylib = {};
  require('./columndefutilscreator')(lib, mylib);
  require('./blankrowfunctionalitycreator')(lib, mylib);
  require('./validitymonitorcreator')(lib, mylib);

  return mylib;
}
module.exports = createUtils;