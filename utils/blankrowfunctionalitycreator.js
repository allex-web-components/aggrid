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
    if (!options) {
      return false;
    }
    if (!isBlankRow(row)) {
      return false;
    }
    if (lib.isArrayOfStrings(options)) {
      ret = options.every(blankRowEditFinishedChecker.bind(null, row));
      row = null;
      return ret;
    }
    return true;
  }
  function toRegular (row) {
    if (!isBlankRow(row)) {
      return row;
    }
    return lib.pickExcept(row, [__MAGICPROPERTYFORBLANKROW]);
  }

  mylib.blankRow = {
    new: newBlankRow,
    is: isBlankRow,
    isEditFinished: isBlankRowEditFinished,
    toRegular: toRegular
  };
}
module.exports = createBlankRowFunctionality;