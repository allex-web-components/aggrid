function createValidityMonitor (lib, outerlib) {
  'use strict';

  function ParticularValidityMonitor (monitor, func) {
    this.monitor = monitor;
    this.func = func;
    this.invalids = new lib.Map();
    this.outputFunc = this.invalider.bind(this);
  }
  ParticularValidityMonitor.prototype.destroy = function () {
    this.outputFunc = null;
    if(this.invalids) {
      this.invalids.destroy();
    }
    this.invalids = null;
  };
  ParticularValidityMonitor.prototype.invalider = function (params) {
    var ret = this.func(params);
    if (!ret) {
      this.invalids.remove(params.node.rowIndex);
      this.monitor.recheck();
      return ret;
    }
    if (this.invalids.get(params.node.rowIndex)) {
      return ret;
    }
    this.invalids.add(params.node.rowIndex, true);
    this.monitor.recheck();
    return ret;
  };

  function ValidityMonitor (grid) {
    this.grid = grid;
    this.particulars = new lib.Map();
  }
  ValidityMonitor.prototype.destroy = function () {
    if(this.particulars) {
      lib.containerDestroyAll(this.particulars);
      this.particulars.destroy();
    }
    this.particulars = null;
    this.grid = null;
  };
  ValidityMonitor.prototype.addParticular = function (colfield, func) {
    var part = this.particulars.get(colfield);
    if (!part) {
      part = new ParticularValidityMonitor(this, func);
      this.particulars.add(colfield, part);
    }
    return part.outputFunc;
  };
  ValidityMonitor.prototype.recheck = function () {
    var totalinvs = this.particulars.reduce(adder, 0);
    this.grid.set('valid', totalinvs==0);
  };

  function adder (res, val, key) {
    return res+val.invalids.count;
  }

  outerlib.ValidityMonitor = ValidityMonitor;
}
module.exports = createValidityMonitor;