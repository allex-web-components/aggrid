function addCellValueHandling (lib, AgGridElement) {
  'use strict';

  
  AgGridElement.prototype.onCellValueChanged = function (params) {
    var rec, fieldname, changed;
    if (params.newValue === params.oldValue) {
      return;
    }
    if (!this.dataOriginals) {
      this.dataOriginals = new lib.Map();
    }
    //console.log('now what', params);
    fieldname = params.colDef.field;
    rec = this.dataOriginals.get(params.rowIndex);
    if (!rec) {
      rec = lib.extend({}, params.data);
      rec[fieldname] = params.oldValue;
      this.dataOriginals.add(params.rowIndex, rec);
    }
    changed = params.data[fieldname]!==rec[fieldname];
    params.data['allexAgGrid_'+fieldname+'_changed'] = changed;
    if (noChanged(params.data)) {
      params.data = this.dataOriginals.remove(params.rowIndex);
    }
    params.api.refreshCells();
    this.set('editedCellCount', this.get('editedCellCount') + (changed ? 1 : -1));
  };

  AgGridElement.prototype.purgeDataOriginals = function () {
    if (this.dataOriginals) {
      this.dataOriginals.destroy();
    }
    this.dataOriginals = null;
  };

  AgGridElement.prototype.revertAllEdits = function () {
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
  AgGridElement.prototype.dataCleanOfChangedKeys = function (data) {
    if (!lib.isArray(data)) {
      return data;
    }
    return data.map(changedCleaner);
  };

  function noChanged (record) {
    return !lib.traverseShallowConditionally(record, changedDetector);
  }
  function changedDetector (val, name) {
    if (name.substr(0, 12) != 'allexAgGrid_') {
      return;
    }
    if (name.substr(-8) != '_changed') {
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