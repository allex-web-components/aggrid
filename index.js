(function (execlib) {
  'use strict';

  var mylib = {};

  require('./formatters')(execlib, mylib);
  require('./elements')(execlib, mylib);

  execlib.execSuite.libRegistry.register('allex_aggridwebcomponent', mylib);
})(ALLEX);
