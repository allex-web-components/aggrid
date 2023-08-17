function createGridMixins (execlib, outerlib) {
  'use strict';

  var mylib = {};

  require('./editablemixincreator')(execlib, outerlib, mylib);
  require('./contextmenuablemixincreator')(execlib, outerlib, mylib);
  require('./tablemixincreator')(execlib, outerlib, mylib);

  outerlib.gridmixins = mylib;
}
module.exports = createGridMixins;