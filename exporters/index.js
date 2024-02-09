function createExporters (execlib, outerlib) {
  'use strict';

  outerlib.exporters = require('./factorycreator')(execlib, outerlib);
  require('./basecreator')(execlib, outerlib);
  require('./csvcreator')(execlib, outerlib);
  require('./excelcreator')(execlib, outerlib);
}
module.exports = createExporters;