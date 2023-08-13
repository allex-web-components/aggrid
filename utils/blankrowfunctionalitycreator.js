function createBlankRowFunctionality (lib, mylib) {
  'use strict';

  var __MAGICPROPERTYFORBLANKROW = '__allexAgGridBlank';

  function newBlankRow () {
    var ret = {};
    ret[__MAGICPROPERTYFORBLANKROW] = true;
    return ret;
  }
  function blankRowEditFinishedChecker (row, prop) {
    return lib.isVal(row[prop]);
  }
  function isBlankRow (row) {
    return !!row[__MAGICPROPERTYFORBLANKROW];
  }
  function isBlankRowEditFinished (row, options) {
    var ret = false;
    if (!(options && options.musthave)) {
      return false;
    }
    if (!isBlankRow(row)) {
      return false;
    }
    if (lib.isArrayOfStrings(options.musthave)) {
      ret = options.musthave.every(blankRowEditFinishedChecker.bind(null, row));
      row = null;
      return ret;
    }
    return true;
  }
  function filler (invalpropnamechecker, ret, val, key) {
    if (key == __MAGICPROPERTYFORBLANKROW) {
      return;
    }
    if (lib.isFunction(invalpropnamechecker) && invalpropnamechecker(key)) {
      return;
    }
    ret[key] = val;
  }
  function toRegular (invalpropnamechecker, row) {
    if (!isBlankRow(row)) {
      return row;
    }
    var ret = {}, _r = ret;
    lib.traverseShallow(row, filler.bind(null, invalpropnamechecker, _r));
    _r = null;
    return ret;
  }
  function emptier (invalpropnamechecker, rownode, val, key) {
    if (key == __MAGICPROPERTYFORBLANKROW) {
      return;
    }
    if (lib.isFunction(invalpropnamechecker) && invalpropnamechecker(key)) {
      return;
    }
    try {
      rownode.setDataValue(key, void 0);
    } catch (e) {}
  }
  function clearBlankRowNode (invalpropnamechecker, rownode) {
    if (!(rownode && rownode.data && isBlankRow(rownode.data))) {
      return;
    }
    lib.traverseShallow(rownode.data, emptier.bind(null, invalpropnamechecker, rownode));
    invalpropnamechecker = null;
    rownode = null;
  }

  mylib.blankRow = {
    new: newBlankRow,
    is: isBlankRow,
    isEditFinished: isBlankRowEditFinished,
    toRegular: toRegular,
    clearBlankRowNode: clearBlankRowNode
  };
}
module.exports = createBlankRowFunctionality;