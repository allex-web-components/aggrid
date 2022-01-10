function createColumnDefUtils (lib, outerlib) {
  'use strict';

  var mylib = {};

  ////////forEach
  function forEachRealColumnDef (arry, cb) {
    if (!lib.isArray(arry)) {
      return;
    };
    arry.forEach(doColumnDefInForEach.bind(null, cb));
    cb = null;
  };
  function doColumnDefInForEach (cb, coldef) {
    if (!coldef) {
      return;
    }
    if (lib.isArray(coldef.children)) {
      forEachRealColumnDef(coldef.children, cb);
      return;
    }
    cb (coldef);
  };
  mylib.forEachRealColumnDef = forEachRealColumnDef;
  ////////forEach end

  ////////reduce
  function reduceRealColumnDefs (arry, cb, initvalue) {
    var ret;
    if (!lib.isArray(arry)) {
      return initvalue;
    };
    ret = arry.reduce(doColumnDefInReduce.bind(null, cb), initvalue);
    cb = null;
    return ret;
  };
  function doColumnDefInReduce (cb, res, coldef) {
    if (!coldef) {
      return res;
    }
    if (lib.isArray(coldef.children)) {
      return reduceRealColumnDefs(coldef.children, cb, res);
    }
    return cb (res, coldef);
  };
  mylib.reduceRealColumnDefs = reduceRealColumnDefs;
  ////////reduce end

  //deepCopy
  function deepCopy (coldefs) {
    var i, ret, coldef;
    if (!lib.isArray(coldefs)) {
      return null;
    }
    ret = [];
    for (i=0; i<coldefs.length; i++) {
      coldef = lib.extend({}, coldefs[i]);
      if (lib.isArray(coldef.children)) {
        coldef.children = deepCopy(coldefs[i].children);
      }
      ret.push(coldef);
    }
    return ret;
  }
  mylib.deepCopy = deepCopy;
  //deepCopy end

  //find
  function findRealColumnDefByField (coldefs, fldname, cb) {
    var i, coldef, ret;
    if (!lib.isArray(coldefs)) {
      return null;
    }
    for (i=0; i<coldefs.length; i++) {
      coldef = coldefs[i];
      if (lib.isArray(coldef.children)) {
        ret = findRealColumnDefByField(coldef.children, fldname, cb);
        if (ret) {
          return ret;
        }
      }
      if (coldef && coldef.field == fldname) {
        if (lib.isFunction(cb)) {
          cb(coldef, coldefs, i);
        }
        return coldef;
      }
    }
  }
  mylib.findRealColumnDefByField = findRealColumnDefByField;
  function findRealColumnDefByFieldAndDeleteIt (coldefs, fldname) {
    return findRealColumnDefByField(coldefs, fldname, deleterOnFound);
  }
  function deleterOnFound (coldef, coldefs, index) {
    coldefs.splice(index, 1);
  }
  mylib.findRealColumnDefByFieldAndDeleteIt = findRealColumnDefByFieldAndDeleteIt;
  //find end

  outerlib.columnDef = mylib;
}
module.exports = createColumnDefUtils;