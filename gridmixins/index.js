function createGridMixins (execlib, outerlib) {
  'use strict';

  var mylib = {};

  require('./editablecreator')(execlib, outerlib, mylib);
  require('./contextmenuablecreator')(execlib, outerlib, mylib);
  require('./tablecreator')(execlib, outerlib, mylib);
  require('./exportablecreator')(execlib, outerlib, mylib);

  outerlib.gridmixins = mylib;
}
module.exports = createGridMixins;