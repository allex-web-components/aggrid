function createExportableMixin (execlib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function ExportableAgGridMixin (options) {

  }
  ExportableAgGridMixin.prototype.destroy = function () {

  };
  ExportableAgGridMixin.prototype.export = function (options) {
    var exprtr = outerlib.exporters.create(this, options), result;
    exprtr.go();
    result = exprtr.result;
    exprtr.destroy();
    return result;
  };

  ExportableAgGridMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, ExportableAgGridMixin
      , 'export'
    )
  };

  //classes
  //endof classes

  //statics on ExportableAgGridMixin
  
  //endof statics on ExportableAgGridMixin

  mylib.Exportable = ExportableAgGridMixin;
}
module.exports = createExportableMixin;