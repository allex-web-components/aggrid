function createFullWidthRowManagerBase (execlib, applib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function FullWidthRowManagerBase (gridel, options) {
    this.gridEl = gridel;
    this.options = options;
    this.gridconf = options.aggrid;
  }
  FullWidthRowManagerBase.prototype.destroy = function () {
    this.gridconf = null;
    this.options = null;
    this.gridEl = null;
  };
  FullWidthRowManagerBase.prototype.isFullWidthRow = function (rownode) {
    return rownode &&
      rownode.data &&
      rownode.data.allexAgFullWidthRowInfo &&
      rownode.data.allexAgFullWidthRowInfo.instance == this;
  };
  FullWidthRowManagerBase.prototype.render = function (params) {
    throw new lib.Error('NOT_IMPLMENTED', 'render has to be implemented by '+this.constructor.name);
  };

  FullWidthRowManagerBase.prototype.fullWidthRowData = function (masterrowparams) {
    var ret = lib.extend(
      {},
      masterrowparams.data,
      {
        allexAgFullWidthRowInfo: {
          orig_data: masterrowparams.data,
          instance: null,
          handler: null
        }
      }
    );
    ret.allexAgFullWidthRowInfo.instance = this;
    ret.allexAgFullWidthRowInfo.nodeIndex = masterrowparams.node.id;
    return ret;
  };

  mylib.FullWidthRowManagerBase = FullWidthRowManagerBase;
}
module.exports = createFullWidthRowManagerBase;