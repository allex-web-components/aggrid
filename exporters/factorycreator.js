function createExporterFactory (execlib, outerlib) {
  'use strict';

  var lib = execlib.lib;

  function ExporterFactory () {
    lib.Map.call(this);
  }
  lib.inherit(ExporterFactory, lib.Map);
  ExporterFactory.prototype.create = function (grid, options) {
    var item, base;
    if (!(options && options.type)) {
      return null;
    }
    var item = this.get(options.type);
    if (!lib.isFunction(item)) {
      return item;
    }
    base = this.get('base');
    if (classInheritsFrom(item, base)) {
      return new item(grid, lib.pickExcept(options, ['type']));
    }
    return item(grid, options);
  }

  //helpers
  function classInheritsFrom (klass, from) {
    if (!(klass && klass.prototype)) {
      return false;
    }
    if (klass.prototype.constructor == from) {
      return true;
    }
    if (klass.prototype instanceof from) {
      return true;
    }
    return false;
  }
  //endof helpers

  return new ExporterFactory();
}
module.exports = createExporterFactory;