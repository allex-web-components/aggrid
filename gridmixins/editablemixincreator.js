function addCellValueHandling (execlib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  var ChangedKeyPrefix = 'allexAgGrid_',
    ChangedKeySuffix = '_changed';

  function EditableAgGridMixin (options) {
    this.cellEdited = this.createBufferableHookCollection();
    this.onCellValueChanger = this.onCellValueChanged.bind(this);
    this.dataOriginals = null;
    this.editedCellCount = 0;
  }

  EditableAgGridMixin.prototype.destroy = function () {
    this.purgeDataOriginals();

    /*
    if (this.onCellValueChanger) {
      if (this.getConfigVal('aggrid') && lib.isFunction(this.getConfigVal('aggrid').api.removeEventListener)) {
        this.getConfigVal('aggrid').api.removeEventListener('cellValueChanged', this.onCellValueChanger);
      }
    }
    */
    this.editedCellCount = null;
    this.onCellValueChanger = null;
    if (this.cellEdited) {
      this.cellEdited.destroy();
    }
    this.cellEdited = null;
  };
  
  EditableAgGridMixin.prototype.onCellValueChanged = function (params) {
    var rec, fieldname, changed;
    if (params.newValue === params.oldValue) {
      this.cellEdited.fire(params);
      return;
    }
    if (!this.dataOriginals) {
      this.dataOriginals = new lib.Map();
    }
    //console.log('now what', params);
    fieldname = params.colDef.field;
    console.log('change on', fieldname);
    rec = this.dataOriginals.get(params.rowIndex);
    if (!rec) {
      rec = lib.extend({}, params.data);
      rec[fieldname] = params.oldValue;
      this.dataOriginals.add(params.rowIndex, rec);
    }
    changed = params.data[fieldname]!==rec[fieldname];
    params.data[ChangedKeyPrefix+fieldname+ChangedKeySuffix] = changed;
    if (noChanged(params.data)) {
      params.data = this.dataOriginals.remove(params.rowIndex);
    }
    params.api.refreshCells();
    this.cellEdited.fire(params);
    this.set('editedCellCount', this.get('editedCellCount') + (changed ? 1 : -1));
  };

  EditableAgGridMixin.prototype.purgeDataOriginals = function () {
    if (this.dataOriginals) {
      this.dataOriginals.destroy();
    }
    this.dataOriginals = null;
  };

  EditableAgGridMixin.prototype.revertAllEdits = function () {
    var data;
    if (!this.dataOriginals) {
      return;
    }
    data = this.get('data').slice();
    this.dataOriginals.traverse(function (val, recindex) {
      data[recindex] = val;
    });
    //this.purgeDataOriginals();
    this.set('data', data);
    this.purgeDataOriginals();
    this.set('editedCellCount', 0);
    data = null;
  };
  EditableAgGridMixin.prototype.get_dataWOChangedKeys = function () {
    return this.dataCleanOfChangedKeys(this.get('data'));
  };

  EditableAgGridMixin.prototype.dataCleanOfChangedKeys = function (data) {
    return lib.isArray(data) ? data.map(changedCleaner) : data;
  };

  EditableAgGridMixin.prototype.updateRow = function (index, record) {
    var model = this.doApi('getModel'), rownode, ret;
    if (!model) {
      return;
    }
    rownode = model.getRowNode(index);
    if (!rownode) {
      return;
    }
    //this.forEachRealColumnDef(this.setDataValueRowNodeRecColDef.bind(this, rownode, record));
    ret = this.reduceRealColumnDefs(this.setDataValueRowNodeRecColDef.bind(this, rownode, record), null);
    rownode = null;
    record = null;
    return ret;
    //for (prop in record) {
    //  rownode.setDataValue(prop, record[prop]);
    //}
    //rownode.setData(record);
  };

  EditableAgGridMixin.prototype.updateConsecutiveRows = function (rows, startindex, endindex, step, offset) {
    var i, ret;
    if (step > 0) {
      for (i = startindex; i <= endindex; i+=step) {
        ret = this.updateRow(i, rows[i]);
      }
    }
    if (step < 0) {
      for (i = startindex; i >= endindex; i+=step) {
        ret = this.updateRow(i, rows[i]);
      }
    }
    return ret;
  };

  EditableAgGridMixin.prototype.setDataValueRowNodeRecColDef = function (rownode, record, res, coldef) {
    if (!(coldef.field in record)) {
      return res;
    }
    /*
    console.log('setting val for', coldef.field);
    rownode.setDataValue(coldef.field, record[coldef.field]);
    */
    return this.jobs.run('.', new outerlib.jobs.CellUpdater(this, rownode, coldef.field, record[coldef.field]));
  }

  EditableAgGridMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, EditableAgGridMixin
      , 'onCellValueChanged'
      , 'purgeDataOriginals'
      , 'revertAllEdits'
      , 'get_dataWOChangedKeys'
      , 'dataCleanOfChangedKeys'
      , 'updateRow'
      , 'updateConsecutiveRows'
      , 'setDataValueRowNodeRecColDef'
    );
  }

  mylib.Editable = EditableAgGridMixin;

  function noChanged (record) {
    return !lib.traverseShallowConditionally(record, changedDetector);
  }
  function changedDetector (val, name) {
    if (name.substr(0, ChangedKeyPrefix.length) != ChangedKeyPrefix) {
      return;
    }
    if (name.substr(-ChangedKeySuffix.length) != ChangedKeySuffix) {
      return;
    }
    if (val) {
      return true;
    }
  }
  function changedCleaner (record) {
    var ret = {}, prop;
    for(prop in record) {
      if (!record.hasOwnProperty(prop)) {
        continue;
      }
      if (changedDetector(true, prop)){
        continue;
      }
      ret[prop] = record[prop];
    }
    return ret;
  }
}
module.exports = addCellValueHandling;