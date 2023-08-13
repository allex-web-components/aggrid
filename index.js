(function (execlib) {
  'use strict';

  var mylib = {
    utils: require('./utils')(execlib.lib),
    jobs: require('./jobs')(execlib),
    gridmixins: null
  };
  require('./gridmixins')(execlib, mylib);

  require('./formatters')(execlib, mylib);
  require('./editors')(execlib, mylib);
  require('./parsers')(execlib, mylib);
  require('./elements')(execlib, mylib);
  require('./fields')(execlib, mylib);

  execlib.execSuite.libRegistry.register('allex_aggridwebcomponent', mylib);
})(ALLEX);
