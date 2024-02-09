function createBaseExporter (execlib, outerlib) {
  'use strict';

  var lib = execlib.lib;

  function Exporter (grid, options) {
    this.grid = grid;
    this.options = options||{};
    this.visibleGroups = null;
    this.visibleColumnNames = null;
    this.visibleColumnIds = null;
    this.result = null;
    ctorInit.call(this);
  }
  Exporter.prototype.destroy = function () {
    this.result = null;
    this.visibleColumnIds = null;
    this.visibleColumnNames = null;
    this.visibleGroups = null;
    this.options = null;
    this.grid = null;
  };
  Exporter.prototype.go = function () {
    var methodname;
    this.initResult();
    if (!this.grid) {
      return;
    }
    if (this.options.headernames) {
      if (groupNamesUsable.call(this)) {
        goGroupNames.call(this);
      }
      goColumnNames.call(this);
    }
    switch (this.options.rows) {
      case 'all':
        methodname = 'forEachNode';
        break;
      case 'afterfilter':
        methodname = 'forEachNodeAfterFilter';
        break;
      case 'afterfilterandsort':
      default:
        methodname = 'forEachNodeAfterFilterAndSort';
        break;
    }
    this.grid.doApi(methodname, rowTraverser.bind(this));
    this.closeResult();
  };

  //abstractions on Exporter
  Exporter.prototype.initResult = function () {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement initResult');
  };
  Exporter.prototype.startNewRow = function () {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement startNewRow');
  };
  Exporter.prototype.addNewCell = function (contents) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement addNewCell');
  };
  Exporter.prototype.closeResult = function () {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement closeResult');
  };
  //endof abstractions on Exporter

  /*
  getValue(colID, rowNode)
  */

  //statics on Exporter
  function ctorInit () {
    var vsblcols;
    vsblcols = this.grid.doApi('getAllGridColumns').filter(function (col) {return col.visible});
    this.visibleGroups = vsblcols.reduce(function(ret, col, index, cols) {
      if (!(ret.currgrp && ret.currgrp.name == col.parent.providedColumnGroup.colGroupDef.headerName)) {
        if(ret.currgrp) {
          ret.ret.push(ret.currgrp);
        }
        ret.currgrp = {
          name: col.parent.providedColumnGroup.colGroupDef.headerName,
          length: 1
        };
      } else {
        ret.currgrp.length++;
      }
      if (index >= cols.length-1) {
        ret.ret.push(ret.currgrp);
        ret.currgrp = null;
      }
      return ret;
    }, {currgrp: null, ret: []}).ret;
    this.visibleColumnNames = vsblcols.map(function(col) {return col.colDef.headerName});
    this.visibleColumnIds = vsblcols.map(function(col) {return col.colId});
  }
  function groupNamesUsable () {
    if (!lib.isNonEmptyArray(this.visibleGroups)) {
      return false;
    }
    return this.visibleGroups.reduce(function (ret, grp) {return grp.name && grp.length>0}, false);
  }
  function goGroupNames () {
    this.startNewRow();
    this.visibleGroups.forEach(onGroupName.bind(this));
  }
  function onGroupName (grp) {
    var i;
    this.addNewCell(grp.name);
    for (i=0; i<grp.length-1; i++) {
      this.addNewCell();
    }
  }
  function goColumnNames () {
    this.startNewRow();
    this.visibleColumnNames.forEach(onColumnName.bind(this));
  }
  function onColumnName (colname) {
    this.addNewCell(colname);
  }
  function rowTraverser (rownode) {
    if (this.options.selectedonly && !rownode.isSelected()) {
      return;
    }
    this.startNewRow();
    this.visibleColumnIds.forEach(cellTraverser.bind(this, rownode));
    rownode = null;
  }
  function cellTraverser (rownode, cellid) {
    this.addNewCell(this.grid.doApi('getValue', cellid, rownode));
  }
  //endof statics on Exporter

  outerlib.exporters.add('base', Exporter);
}
module.exports = createBaseExporter;