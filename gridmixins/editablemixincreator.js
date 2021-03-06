function addCellValueHandling (execlib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  var ChangedKeyPrefix = 'allexAgGrid_',
    ChangedKeySuffix = '_changed',
    EditableEditedCountPropName = ChangedKeyPrefix+'editableEditedCount';

  function EditableAgGridMixin (options) {
    this.cellEdited = this.createBufferableHookCollection();
    this.editablepropnames = null;
    this.onCellValueChanger = this.onCellValueChanged.bind(this);
    this.dataOriginals = null;
    this.editedCellCount = 0;
    this.editableEditedCellCount = 0;
    this.editedRowsCount = 0;
    this.inBatchEdit = false;
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
    this.inBatchEdit = null;
    this.editedRowsCount = null;
    this.editableEditedCellCount = null;
    this.editedCellCount = null;
    this.onCellValueChanger = null;
    this.editablepropnames = null;
    if (this.cellEdited) {
      this.cellEdited.destroy();
    }
    this.cellEdited = null;
  };

  EditableAgGridMixin.prototype.makeUpRunTimeConfiguration = function (obj) {
    var aggrid, coldefs;
    obj.onCellValueChanged = this.onCellValueChanger;
    aggrid = this.getConfigVal('aggrid');
    if (!aggrid) {
      return;
    }
    coldefs = aggrid.columnDefs;
    if (!lib.isArray(coldefs)) {
      return;
    }
    this.editablepropnames = coldefs.reduce(editableChooser, []);
  };

  function editableChooser (res, coldef) {
    if (coldef.editable) {
      res.push(coldef.field);
    }
    if (lib.isArray(coldef.children)) {
      return coldef.children.reduce(editableChooser, res);
    }
    return res;
  }
  
  EditableAgGridMixin.prototype.onCellValueChanged = function (params) {
    var rec, fieldname, editableedited, changed, changedcountdelta;
    if (params.newValue === params.oldValue) {
      this.cellEdited.fire(params);
      return;
    }
    if (!this.dataOriginals) {
      this.dataOriginals = new lib.Map();
    }
    fieldname = params.colDef.field;
    editableedited = params.colDef && params.colDef.editable;
    rec = this.dataOriginals.get(params.rowIndex);
    if (!rec) {
      rec = lib.extendShallow({}, params.data);
      rec[fieldname] = params.oldValue;
      this.dataOriginals.add(params.rowIndex, rec);
    }
    changed = params.data[fieldname]!==rec[fieldname];
    changedcountdelta = changed ? 1 : -1;
    if (!(EditableEditedCountPropName in params.data)) {
      params.data[EditableEditedCountPropName] = 0;
    }
    if (editableedited) {
      params.data[EditableEditedCountPropName] += changedcountdelta;
    }
    params.data[ChangedKeyPrefix+fieldname+ChangedKeySuffix] = changed;
    if (!ChangedKeyPrefix)
    if (noChanged(params.data)) {
      params.data = this.dataOriginals.remove(params.rowIndex);
    }
    if (!this.inBatchEdit) {
        params.api.refreshCells();
    }
    this.cellEdited.fire(params);
    this.set('editedCellCount', this.get('editedCellCount') + changedcountdelta);
    if (editableedited) {
      this.set('editableEditedCellCount', this.get('editableEditedCellCount') + (changed ? 1 : -1));
    }
    this.set('editedRowsCount', this.dataOriginals.count);
  };

  EditableAgGridMixin.prototype.startBatchEdit = function () {
    this.inBatchEdit = true;
  };
  EditableAgGridMixin.prototype.endBatchEdit = function () {
    this.inBatchEdit = false;
    this.doApi('refreshCells');
  };

  EditableAgGridMixin.prototype.purgeDataOriginals = function () {
    if (this.dataOriginals) {
      this.dataOriginals.destroy();
    }
    this.dataOriginals = null;
    this.set('editedRowsCount', 0);
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
    this.set('editableEditedCellCount', 0);
    data = null;
  };
  EditableAgGridMixin.prototype.get_dataWOChangedKeys = function () {
    return this.dataCleanOfChangedKeys(this.get('data'), false);
  };
  EditableAgGridMixin.prototype.get_changedRowsWOChangedKeys = function () {
    return this.dataCleanOfChangedKeys(this.get('data'), true);
  };

  EditableAgGridMixin.prototype.dataCleanOfChangedKeys = function (data, onlyedited) {
    var ret = lib.isArray(data) ? data.reduce(changedCleaner.bind(null, onlyedited), []) : data;
    onlyedited = null;
    return ret;
  };

  EditableAgGridMixin.prototype.getChangedRows = function (onlyeditable) {
    var ret = [], _ret = ret, data;
    if (!this.dataOriginals) {
      return ret;
    }
    data = this.get('data');
    if (!lib.isArray(data)) {
      return ret;
    }
    //this.dataOriginals.traverse(dataOriginalsTraverserForFill.bind(null, changedRowsFiller, onlyeditable, data, _ret));
    traverseOriginalsOrderly.call(this, dataOriginalsTraverserForFill.bind(null, changedRowsFiller, onlyeditable, data, _ret));
    onlyeditable = null;
    data = null;
    _ret = null;
    return ret;
  };  
  EditableAgGridMixin.prototype.getChangedRowDeltas = function (onlyeditable) {
    var ret = [], _ret = ret, data;
    if (!this.dataOriginals) {
      return ret;
    }
    data = this.get('data');
    if (!lib.isArray(data)) {
      return ret;
    }
    //this.dataOriginals.traverse(dataOriginalsTraverserForFill.bind(null, changedRowDeltasFiller.bind(this), onlyeditable, data, _ret));
    traverseOriginalsOrderly.call(this, dataOriginalsTraverserForFill.bind(null, changedRowDeltasFiller.bind(this), onlyeditable, data, _ret));
    data = null;
    _ret = null;
    return ret;
  };
  EditableAgGridMixin.prototype.getChangedRowsWithOriginalsWOChangedKeys = function (prefixsuffixobj) {
    var newdata = this.dataCleanOfChangedKeys(this.get('data'), true);
    var indices = this.dataOriginals.keys().sort(function (a,b) {return a - b});
    var i, rec, origrec;
    if (newdata.length != indices.length) {
      throw new lib.Error('LENGTH_MISMATCH', 'New data has '+newdata.length+' items, but it should have been '+indices.length+' items');
    }
    for (i=0; i<indices.length; i++) {
      rec = newdata[i];
      origrec = this.dataOriginals.get(indices[i]);
      this.editablepropnames.forEach(origdataadder.bind(null, rec, origrec, prefixsuffixobj));
      rec = null;
      origrec = null;
    }
    return newdata;
  };

  function origdataadder (rec, origrec, prefixsuffixobj, propname) {
    var pref = prefixsuffixobj ? (prefixsuffixobj.prefix || 'original') : 'original',
      suff = prefixsuffixobj ? (prefixsuffixobj.suffix || '') : '';
    rec[pref+propname+suff] = origrec[propname];
  }

  
  EditableAgGridMixin.prototype.updateRowSync = function (index, record) {
    var rownode, aggridopts, coldefs, oldrec, oldrec4update, prop, coldef;
    rownode = this.rowNodeForIndex(index);
    if (!rownode) {
      return;
    }
    aggridopts = this.getConfigVal('aggrid');
    if (!aggridopts) {
      return;
    }
    coldefs = this.deepCopyColumnDefs();
    if (!lib.isArray(coldefs)) {
      return;
    }
    oldrec = rownode.data;
    oldrec4update = lib.isFunction(oldrec.clone) ? oldrec.clone() : lib.extendShallow({}, oldrec);
    this.data[index] = oldrec4update;
    for (prop in record) {
      if (!record.hasOwnProperty(prop)) {
        continue;
      }
      if (record[prop] === oldrec[prop]) {
        continue;
      }
      coldef = outerlib.utils.columnDef.findRealColumnDefByFieldAndDeleteIt(coldefs, prop);
      if (!coldef){
        continue;
      }
      /**/
      oldrec4update[prop] = record[prop];
      this.onCellValueChanged ({
        oldValue: oldrec[prop],
        newValue: record[prop],
        colDef: coldef,
        rowIndex: index,
        node: rownode,
        data: oldrec4update,
        api: aggridopts.api
      });
      /**/
    }
    rownode.setData(oldrec4update);
  };

  EditableAgGridMixin.prototype.updateConsecutiveRowsSync = function (rows, startindex, endindex, step, offset) {
    var i;
    offset = offset || 0;
    this.startBatchEdit();
    if (step > 0) {
      for (i = startindex; i <= endindex; i+=step) {
        this.updateRowSync(i, rows[i+offset]);
      }
    }
    if (step < 0) {
      for (i = startindex; i >= endindex; i+=step) {
        this.updateRowSync(i, rows[i+offset]);
      }
    }
    this.endBatchEdit();
  };

  EditableAgGridMixin.prototype.updateRow = function (index, record) {
    var rownode, ret;
    rownode = this.rowNodeForIndex(index);
    if (!rownode) {
      return;
    }
    ret = this.reduceRealColumnDefs(this.setDataValueRowNodeRecColDef.bind(this, rownode, record), null);
    rownode = null;
    record = null;
    return ret;
    //rownode.setData(record);
  };


  EditableAgGridMixin.prototype.updateConsecutiveRows = function (rows, startindex, endindex, step, offset) {
    var i, ret;
    offset = offset || 0;
    this.startBatchEdit();
    if (step > 0) {
      for (i = startindex; i <= endindex; i+=step) {
        ret = this.updateRow(i, rows[i+offset]);
      }
    }
    if (step < 0) {
      for (i = startindex; i >= endindex; i+=step) {
        ret = this.updateRow(i, rows[i+offset]);
      }
    }
    ret.then(
      this.endBatchEdit.bind(this),
      this.endBatchEdit.bind(this)
    )
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
      , 'get_changedRowsWOChangedKeys'
      , 'dataCleanOfChangedKeys'
      , 'getChangedRows'
      , 'getChangedRowDeltas'
      , 'getChangedRowsWithOriginalsWOChangedKeys'
      , 'startBatchEdit'
      , 'endBatchEdit'
      , 'updateRowSync'
      , 'updateConsecutiveRowsSync'
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
  function changedCleaner (onlyedited, res, record) {
    var ret, prop;
    if (onlyedited && noChanged(record)) {
      return res;
    }
    ret = {};
    for(prop in record) {
      if (!record.hasOwnProperty(prop)) {
        continue;
      }
      if (changeKeyDetector(prop)){
        continue;
      }
      ret[prop] = record[prop];
    }
    res.push(ret);
    return res;
  }
  function changeKeyDetector (name) {
    if (name == EditableEditedCountPropName) {
      return true;
    }
    if (name.substr(0, ChangedKeyPrefix.length) == ChangedKeyPrefix) {
      return true;
    }
    if (name.substr(-ChangedKeySuffix.length) == ChangedKeySuffix) {
      return true;
    }
  }

  function dataOriginalsTraverserForFill (cb, onlyeditable, allrows, changedrows, origrow, changedindex) {
    if (!lib.isFunction(cb)) {
      return;
    }
    var rec = allrows[changedindex];
    if (onlyeditable && !(rec[EditableEditedCountPropName]>0)) {
      return;
    }
    cb(onlyeditable, allrows, changedrows, origrow, changedindex, rec);
  }

  function changedRowsFiller (onlyeditable, allrows, changedrows, origrow, changedindex, rec) {
    changedrows.push(rec);
  }  
  function changedRowDeltasFiller (onlyeditable, allrows, changedrows, origrow, changedindex, rec) {
    var deltas = {}, prop, delta;
    for(prop in origrow) {
      if (!origrow.hasOwnProperty(prop)) {
        continue;
      }
      if (!rec.hasOwnProperty(prop)) {
        continue;
      }
      if (!(lib.isNumber(origrow[prop]) && lib.isNumber(rec[prop]))) {
        deltas[prop] = rec[prop];
        continue;
      }
      deltas[prop] = onlyeditable 
      ?
      rec[prop]-origrow[prop]
      :
      ( this.editablepropnames.indexOf(prop)>=0 ? rec[prop]-origrow[prop] : origrow[prop] )
      ;
    }
    changedrows.push(deltas);
  }

  //static
  function traverseOriginalsOrderly (cb) {
    var nodes = [], _nds = nodes, _cb = cb;
    this.dataOriginals.traverse(function (rec, index) {
      _nds.push({rec: rec, index: index});
    });
    _nds = null;
    nodes.sort(function(a,b){return a.index-b.index});
    nodes.forEach(function (n) {
      _cb(n.rec, n.index);
    })
    _cb = null;
  }
}
module.exports = addCellValueHandling;