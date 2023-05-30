function createAllexUniqueEditor (execlib, lR, o, m, outerlib, mylib) {
  'use strict';

  var Base = mylib.AllexInputBase;
  var lib = execlib.lib;
  var arryopslib = lR.get('allex_arrayoperationslib');

  function AllexUniqueEditor () {
    Base.call(this);
  }
  lib.inherit(AllexUniqueEditor, Base);
  AllexUniqueEditor.prototype.destroy = function () {
    Base.prototype.destroy.call(this);
  };
  AllexUniqueEditor.prototype.afterGuiAttached = function () {
    this.initParams.validations = this.initParams.validations || [];
    this.initParams.validations.push({
      invalid: this.checkUniqueness.bind(this),
      class: 'invalid'
    })
    Base.prototype.afterGuiAttached.call(this);
  };
  AllexUniqueEditor.prototype.checkUniqueness = function (val, oldval) {
    var pdata = this.panel.__parent.get('data') || [];
    var mypropname = this.initParams.colDef.field;
    var myrowindex = this.initParams.node.rowIndex;
    var ret = pdata.every(uniqueer.bind(null, mypropname, myrowindex, val));
    mypropname = null;
    myrowindex = null;
    val = null;
    return !ret;
  };
  function uniqueer (pname, rowindex, val, row, index) {
    if (rowindex == index) {
      return true;
    }
    return row[pname]!==val;
  }

  mylib.AllexUnique = AllexUniqueEditor;
}
module.exports = createAllexUniqueEditor;