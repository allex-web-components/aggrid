function createBlankRowFunctionality (lib, mylib) {
  'use strict';


  function blankRowEditFinishedChecker (row, prop) {
    return lib.isVal(row[prop]);
  }
  function isBlankRowEditFinished (row, options, schema) {
    var ret = false, _r, schemaval;
    if (!options) {
      return;
    }
    if (schema) {
      schemaval = lib.jsonschema.validate(row, schema, {throwError: false});
      if (schemaval.errors.length) {
        console.error(schemaval.errors);
        return false;
      }
    }
    if (lib.isArrayOfStrings(options.musthave)) {
      _r = row;
      ret = options.musthave.every(blankRowEditFinishedChecker.bind(null, _r));
      _r = null;
      if (!ret) {
        return ret;
      }
    }
    return true;
  }
  function filler (invalpropnamechecker, ret, val, key) {
    if (lib.isFunction(invalpropnamechecker) && invalpropnamechecker(key)) {
      return;
    }
    ret[key] = val;
  }
  function toRegular (invalpropnamechecker, row) {
    /*
    if (!isBlankRow(row)) {
      return row;
    }
    */
    var ret = {}, _r = ret;
    lib.traverseShallow(row, filler.bind(null, invalpropnamechecker, _r));
    _r = null;
    return ret;
  }
  function emptier (invalpropnamechecker, rownode, val, key) {
    if (lib.isFunction(invalpropnamechecker) && invalpropnamechecker(key)) {
      return;
    }
    try {
      rownode.setDataValue(key, void 0);
    } catch (e) {}
  }
  function clearBlankRowNode (invalpropnamechecker, rownode) {
    lib.traverseShallow(rownode.data, emptier.bind(null, invalpropnamechecker, rownode));
    invalpropnamechecker = null;
    rownode = null;
  }

  function BlankRowController (grid, config) {
    this.grid = grid;
    this.config = config;
    this.schema = null;
    this.rowNode = null;
    this.hadPreInsertIntervention = false;
    this.buildSchema();
  }
  BlankRowController.prototype.destroy = function () {
    this.hadPreInsertIntervention = null;
    this.rowNode = null;
    this.schema = null;
    this.config = null;
    this.grid = null;
  };
  function requiredpicker (arry, sch, fld) {
    if (sch && sch.required) {
      arry.push(fld);
    }
  }
  BlankRowController.prototype.buildSchema = function () {
    var reqarry, _reqarry;
    if (!this.config) {
      return;
    }
    if (this.config.mustmatch) {
      reqarry = [];
      _reqarry = reqarry;
      lib.traverseShallow(this.config.mustmatch, requiredpicker.bind(null, _reqarry));
      _reqarry = null;
      this.schema = {
        type: 'object',
        properties: this.config.mustmatch,
        required: reqarry
      };
    }
  };
  BlankRowController.prototype.onSetData = function () {
    if (!this.grid) return;
    if (!this.config) return;
    this.rowNode = this.grid.addRowSoft({});
    this.rowNode.isBlank = true;
  };
  BlankRowController.prototype.isBlankRow = function (row) {
    return this.config && this.rowNode.data == row;
  };
  BlankRowController.prototype.ifEditFinished = function (rownode, invalpropnamechecker, func) {
    if (!this.rowNode) {
      return false;
    }
    rownode = rownode || this.rowNode;
    if (this.rowNode !== rownode) {
      return false;
    }
    if (isBlankRowEditFinished(this.rowNode.data, this.config, this.schema)) {
      func(this.config.create_new, toRegular(invalpropnamechecker, this.rowNode.data));
      if (this.config.create_new) {
        this.emptyRow();
      }
      return true;
    }
    clearBlankRowNode(invalpropnamechecker, this.rowNode);
    return false;
  };
  BlankRowController.prototype.hasPropertyValue = function (propname, propval) {
    if (!this.rowNode) {
      return false;
    }
    return this.rowNode.data[propname] == propval;
  };
  BlankRowController.prototype.prepareForInsert = function () {
    var pk, rec;
    if (!this.grid) return;
    if (!this.rowNode) return;
    pk = this.grid.primaryKey;
    rec = this.rowNode.data;
    if (pk && !(pk in rec)) {
      this.hadPreInsertIntervention = true;
      rec[pk] = '';
    }
  }
  BlankRowController.prototype.ackInsertedRow = function (row) {
    var pk, rec;
    if (!this.grid) return;
    if (!this.rowNode) return;
    pk = this.grid.primaryKey;
    rec = this.rowNode.data;
    if (pk) {
      if (this.hadPreInsertIntervention) {
        rec[pk] = null;
      }
      if (rec[pk] == row[pk]) {
        this.emptyRow();
      }
      return;
    }
    //if __not__ primaryKey? probably nothing
  };
  BlankRowController.prototype.emptyRow = function () {
    if (!this.grid) return;
    this.rowNode.setData({});
  };
  BlankRowController.prototype.startEditing = function () {
    if (!(this.grid && this.rowNode)) {
      return;
    }
    if (this.grid.doApi('getEditingCells').length>0) {
      return;
    }
    this.grid.doApi('startEditingCell', {
      rowIndex: this.rowNode.childIndex, 
      colKey: this.grid.editablepropnames[0]
    });
  }
  mylib.BlankRowController = BlankRowController;
}
module.exports = createBlankRowFunctionality;