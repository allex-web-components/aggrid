function createCsvExporter (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;
  var Base = mylib.exporters.get('base');

  function CsvExporter (grid, options) {
    Base.call(this, grid, options);
    this.row = null;
    this.index = null;
  }
  lib.inherit(CsvExporter, Base);
  CsvExporter.prototype.destroy = function () {
    this.index = null;
    this.row = null;
    Base.prototype.destroy.call(this);
  };
  CsvExporter.prototype.initResult = function () {
    this.result = '';
  };
  CsvExporter.prototype.startNewRow = function () {
    this.result = lib.joinStringsWith(this.result, this.row, '\n');
    this.row = '';
    this.index = 0;
  };
  CsvExporter.prototype.addNewCell = function (contents) {
    this.index++;
    var mycontents = lib.isVal(contents) ? contents : '';
    if (this.index == 1) {
      this.row = mycontents;
      return;
    }
    this.row = this.row+(this.options.separator||',')+mycontents;
  };
  CsvExporter.prototype.closeResult = function () {
    this.result = lib.joinStringsWith(this.result, this.row, '\n');
  };

  mylib.exporters.add('csv', CsvExporter);
}
module.exports = createCsvExporter;