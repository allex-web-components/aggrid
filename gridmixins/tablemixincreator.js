function createTableGridMixin (execlib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function TableAgGridMixin (options) {
    if (!(options && options.primaryKey)) {
      throw new lib.Error('PRIMARY_KEY_MISING', this.constructor.name+' needs "primaryKey" String in options');
    }
    this.primaryKey = options.primaryKey;
    this.onGetRowIdForTableer = this.onGetRowIdForTable.bind(this);
    this.onPostSorter = this.onPostSort.bind(this);
  }
  TableAgGridMixin.prototype.destroy = function () {
    this.onPostSorter = null;
    this.onGetRowIdForTableer = null;
    this.primaryKey = null;
  };

  TableAgGridMixin.prototype.makeUpRunTimeConfiguration = function (obj) {
    obj.animateRows = true;
    obj.getRowId = this.onGetRowIdForTableer;
    obj.postSortRows = this.onPostSorter;
  };

  TableAgGridMixin.prototype.findRowAndIndexByVal = function (val) {
    return this.findRowAndIndexByPropVal(this.primaryKey, val);
  };

  TableAgGridMixin.prototype.onGetRowIdForTable = function (params) {
    return params.data[this.primaryKey];
  };
  TableAgGridMixin.prototype.onPostSort = function (params) {
    //console.log('onPostSort', params);
    var br = this.rowNodeForIndexOrRecord(null, {}); //for undefined => blankrow
    var ind, inda, brc;
    if (br) {
      ind = params.nodes.indexOf(br);
      if (ind>=0) {
        inda = params.nodes.splice(ind, 1);
        brc = this.getConfigVal('blankRow');
        params.nodes.splice(
          (brc && brc.position=='bottom') ? params.nodes.length : 0,
          0,
          br
        );
      }
    }
  };
  

  TableAgGridMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, TableAgGridMixin
      , 'findRowAndIndexByVal'
      , 'onGetRowIdForTable'
      , 'onPostSort'
    );
  };

  mylib.Table = TableAgGridMixin;
}
module.exports = createTableGridMixin;