function createExcelExporter (execlib, mylib) {
  'use strict';
  var lib = execlib.lib;
  var Base = mylib.exporters.get('base');

  function ExcelExporter (grid, options) {
    options.title = options.title||'My Title';
    options.subject = options.subject||'My Subject';
    options.author = options.author||'Me';
    options.date = options.date||new Date();
    options.sheet = options.sheet||'Sheet #1';
    Base.call(this, grid, options);
    this.aoa = null;
    this.merges = null;
    this.currentMerge = null;
  }
  lib.inherit(ExcelExporter, Base);
  ExcelExporter.prototype.destroy = function () {
    if(this.currentMerge) {
      this.currentMerge.destroy();
    }
    this.currentMerge = null;
    this.merges = null;
    this.aoa = null;
    Base.prototype.destroy.call(this);
  };
  ExcelExporter.prototype.initResult = function () {
    this.aoa = [];
    this.merges = [];
    if(this.currentMerge) {
      this.currentMerge.destroy();
    }
    this.currentMerge = null;
  };
  ExcelExporter.prototype.startNewRow = function () {
    if (this.currentMerge) {
      this.merges.push(this.currentMerge.close());
      this.currentMerge = null;
    }
    this.aoa.push([]);
  };
  ExcelExporter.prototype.addNewCell = function (contents) {
    if (!lib.defined(contents)) {
      if (!this.currentMerge) {
        this.currentMerge = new Merge(this);
      }
    } else {
      if (this.currentMerge) {
        this.merges.push(this.currentMerge.close());
        this.currentMerge = null;
      }
    }
    this.aoa[this.aoa.length-1].push(contents);
  };
  ExcelExporter.prototype.closeResult = function () {
    var wb = XLSX.utils.book_new(), sheet, wbout;
    wb.Props = {
      Title: this.options.title,
      Subject: this.options.subject,
      Author: this.options.author,
      CreatedDate: this.options.date
    };
    wb.SheetNames.push(this.options.sheet);
    sheet = XLSX.utils.aoa_to_sheet(this.aoa, this.options);
    if (lib.isNonEmptyArray(this.merges)) {
      sheet['!merges'] = this.merges;
    }
    wb.Sheets[this.options.sheet] = sheet;
    this.aoa = null;
    wbout = XLSX.write(wb, {bookType: 'xlsx', type: 'binary'});
    this.result = new Blob([s2ab(wbout)], {type: 'application/octet-stream'});
  };

  //helpers
  function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  }
  function current_aoa_cell (aoa) {
    var rowindex = aoa.length-1;
    var rcells = aoa[rowindex]||[];
    return {r: rowindex, c:Math.max(rcells.length-1, 0)};
  }
  //endof helpers

  //classes
  function Merge (exporter) {
    this.exporter = exporter;
    this.start = current_aoa_cell(this.exporter.aoa);
    this.end = null;
  }
  Merge.prototype.destroy = function () {
    this.exporter = null;
  };
  Merge.prototype.close = function () {
    var ret;
    this.end = current_aoa_cell(this.exporter.aoa);
    ret = {s: this.start, e: this.end};
    this.destroy();
    return ret;
  }
  //endof classes

  mylib.exporters.add('excel', ExcelExporter);
}
module.exports = createExcelExporter;