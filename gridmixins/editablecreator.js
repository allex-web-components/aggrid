function createEditableMixin (execlib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function ChangedCells () {
    lib.Map.call(this);
  }
  lib.inherit(ChangedCells, lib.Map);
  ChangedCells.prototype.check = function (rowindex, prop, indirection) {
      var changes = this.get(rowindex), chindex;
      if (!changes) {
        if (!indirection) {
          return false;
        }
        changes = [prop];
        this.add(rowindex, changes);
        return true;
      }
      chindex = changes.indexOf(prop);
      if (indirection) {
        if (chindex<0) {
          changes.push(prop);
          return true;
        }
        return false;
      }
      if (chindex>=0) {
        changes.splice(chindex, 1);
        return true;
      }
      return false;
  };
  ChangedCells.prototype.cellCount = function () {
    return this.reduce(cellcounter, 0);
  };
  function cellcounter (res, cells, rowindex) {
    return res + cells.length;
  };

  var ChangedKeyPrefix = 'allexAgGrid_',
    ChangedKeySuffix = '_changed',
    EditableEditedCountPropName = ChangedKeyPrefix+'editableEditedCount';

  var IsBlankRowKeyProperty = 'allexAgGridIsBlankRow';

  function trackablesArry (thingy) {
    if (lib.isArray(thingy)) {
      return thingy;
    }
    if (lib.isString(thingy)) {
      return thingy.split(',');
    }
    return [];
  }

  function EditableAgGridMixin (options) {
    this.cellEdited = this.createBufferableHookCollection();
    this.newRowAdded = this.createBufferableHookCollection();
    this.trackablepropnames = trackablesArry(options.trackablepropnames);
    this.editablepropnames = null;
    this.changeablepropnames = null;
    this.onCellValueChanger = this.onCellValueChanged.bind(this);
    this.onRowValueChanger = this.onRowValueChanged.bind(this);
    this.dataOriginals = null;
    this.changedEditableCells = null;
    this.changedNonEditableCells = null;
    this.changedCellCount = 0;
    this.editedCellCount = 0;
    this.editedRowsCount = 0;
    this.addedRowCount = 0;
    this.deletedRowCount = 0;
    this.changedByUser = false;
    this.inBatchEdit = false;
    this.batchEditEvents = null;
    this.internalChange = false;
    this.cellEditingStopped = false;
    this.lastEditedCellsBeforeSetData = null;
    this.pristineData = null;
    this.deletedRows = null;
    this.addedRowAtIndex = null;
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
    this.addedRowAtIndex = null;
    this.deletedRows = null;
    this.pristineData = null;
    this.lastEditedCellsBeforeSetData = null;
    this.cellEditingStopped = null;
    this.internalChange = null;
    this.batchEditEvents = null;
    this.inBatchEdit = null;
    this.changedByUser = null;
    this.deletedRowCount = null;
    this.addedRowCount = null;
    this.editedRowsCount = null;
    this.editedCellCount = null;
    this.changedCellCount = null;
    this.onCellValueChanger = null;
    this.changeablepropnames = null;
    this.editablepropnames = null;
    this.trackablepropnames = null;
    if(this.newRowAdded) {
       this.newRowAdded.destroy();
    }
    this.newRowAdded = null;
    if (this.cellEdited) {
      this.cellEdited.destroy();
    }
    this.cellEdited = null;
  };

  EditableAgGridMixin.prototype.makeUpRunTimeConfiguration = function (obj) {
    var aggrid, coldefs;
    this.setAgGridHandler(obj, 'onCellValueChanged', this.onCellValueChanger);
    this.setAgGridHandler(obj, 'onRowValueChanged', this.onRowValueChanger);
    this.setAgGridHandler(obj, 'onCellKeyDown', this.onKeyDownForEdit.bind(this));
    this.setAgGridHandler(obj, 'onCellEditingStarted', this.onCellEditingStarted.bind(this));
    this.setAgGridHandler(obj, 'onCellEditingStopped', this.onCellEditingStopped.bind(this));
    this.setAgGridHandler(obj, 'onSelectionChanged', this.onSelectionChangedForEdit.bind(this));
    aggrid = this.getConfigVal('aggrid');
    if (!aggrid) {
      return;
    }
    coldefs = aggrid.columnDefs;
    if (!lib.isArray(coldefs)) {
      return;
    }
    this.editablepropnames = coldefs.reduce(editableChooser, []);
    this.changeablepropnames = this.editablepropnames.slice();
    this.trackablepropnames.forEach(checkTrackableInColDefs.bind(null, coldefs));
    obj.enterNavigatesVertically=true;
    obj.enterNavigatesVerticallyAfterEdit=true;
    lib.arryOperations.appendNonExistingItems(this.changeablepropnames, this.trackablepropnames);
    aggrid.navigateToNextCell = nextCellProc.bind(this);
    aggrid.tabToNextCell = nextCellProc.bind(this);
    coldefs = null;
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

  function checkTrackableInColDefs (coldefs, trackablename) {
    var col = outerlib.utils.columnDef.findRealColumnDefByField(coldefs, trackablename);
    if (!col) {
      throw new lib.Error('TRACKABLE_NAME_NOT_A_COLDEF_NAME', 'Trackable name '+trackablename+' is not a name of any columnDef');
    }
  }

  
  EditableAgGridMixin.prototype.onCellValueChanged = function (params) {
    var rec, fieldname, editableedited, changed, changedcountdelta;
    var isBlankRow;
    var pk, pkfound, find4pk;
    if (!this.cellEdited) {
      return;
    }
    if (!(params && lib.isNumber(params.rowIndex))) {
      return;
    }
    pk = this.primaryKey;
    params.inBatchEdit = this.inBatchEdit;    
    params.setValues = setValues.bind(params);
    if (params.newValue === params.oldValue) {
      this.cellEdited.fire(params);
      params = null;
      return;
    }
    if (!this.dataOriginals) {
      this.dataOriginals = new lib.Map();
    }
    if (!this.changedEditableCells) {
      this.changedEditableCells = new ChangedCells();
    }
    if (!this.changedNonEditableCells) {
      this.changedNonEditableCells = new ChangedCells();
    }
    fieldname = params.colDef.field;
    editableedited = params.colDef && params.colDef.editable;
    rec = this.dataOriginals.get(params.rowIndex);
    isBlankRow = params.node.isBlank;
    params.isBlankRow = isBlankRow;
    if (!rec) {
      rec = lib.extendShallow({}, params.data);
      rec[fieldname] = params.oldValue;
      rec[IsBlankRowKeyProperty] = isBlankRow;
      this.dataOriginals.add(params.rowIndex, rec);
    }
    changed = !isBlankRow && params.data[fieldname]!==rec[fieldname];
    pkfound = changed && pk && fieldname==pk;
    this[editableedited ? 'changedEditableCells' : 'changedNonEditableCells'].check(params.rowIndex, fieldname, changed);
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
    if (pkfound) {
      this.removeRow(rec, params.rowIndex);
      find4pk = this.findRowIndexAndInsertIndexByPropVal(pk, params.data[pk]);
      if (find4pk) {
        console.log(pk, params.data[pk], '=>', find4pk.insertafter);
        console.log('onCellValueChanged inserting, synthetic', params.synthetic);
        this.insertRow(params.data, find4pk.insertafter||0);
      }
    }
    if (!this.inBatchEdit) {
        params.api.refreshCells();
    }
    this.cellEdited.fire(params);
    if (this.batchEditEvents) {
      this.batchEditEvents.changed += changedcountdelta;
      this.batchEditEvents.edited += (
        editableedited
        ?
        (changed ? 1 : -1)
        :
        0
      )
      params = null;
      return;
    }
    this.set('editedCellCount', this.changedEditableCells.cellCount());
    this.set('changedCellCount', this.get('editedCellCount') + this.changedNonEditableCells.cellCount());
    this.set('editedRowsCount', this.dataOriginals.count);
    setChangedByUser.call(this);
  };
  EditableAgGridMixin.prototype.onRowValueChanged = function (params) {
    console.log('onRowValueChanged', params);
  };
  EditableAgGridMixin.prototype.onKeyDownForEdit = function (params) {
    if (this.cellEditingStopped && params.event && params.event.key=='Enter') {
      this.cellEditingStopped = false;
      this.blankRowController.ifEditFinished(params.node, isEditableRelatedPropertyName, addNewRowFromBlank.bind(this));
    }
  };
  EditableAgGridMixin.prototype.onCellEditingStarted = function (params) {
    this.lastEditedCellsBeforeSetData = null;
  };
  EditableAgGridMixin.prototype.onCellEditingStopped = function (params) {
    this.cellEditingStopped = true;
  };
  EditableAgGridMixin.prototype.onSelectionChangedForEdit = function (params) {
    if (this.cellEditingStopped) {
      this.cellEditingStopped = false;
      this.blankRowController.ifEditFinished(null, isEditableRelatedPropertyName, addNewRowFromBlank.bind(this));
    }
    //console.log('onSelectionChangedForEdit', params);
  };

  EditableAgGridMixin.prototype.startBatchEdit = function () {
    this.inBatchEdit = true;
    this.batchEditEvents = {
      edited: 0,
      changed: 0
    };
  };
  EditableAgGridMixin.prototype.endBatchEdit = function () {
    this.inBatchEdit = false;
    if (this.batchEditEvents) {
      this.set('changedCellCount', this.get('changedCellCount') + this.batchEditEvents.changed);
      this.set('editedCellCount', this.get('editedCellCount') + this.batchEditEvents.edited);
      setChangedByUser.call(this);
    }
    this.batchEditEvents = null;
    this.doApi('refreshCells');
  };

  EditableAgGridMixin.prototype.purgeDataOriginals = function () {
    if (this.dataOriginals) {
      this.dataOriginals.destroy();
    }
    this.dataOriginals = null;
    if (this.changedEditableCells) {
      this.changedEditableCells.destroy();
    }
    this.changedEditableCells = null;
    if (this.changedNonEditableCells) {
      this.changedNonEditableCells.destroy();
    }
    this.changedNonEditableCells = null;
    this.set('editedRowsCount', 0);
    this.set('changedCellCount', 0);
    this.set('editedCellCount', 0);
    setChangedByUser.call(this);
  };

  EditableAgGridMixin.prototype.revertAllEdits = function () {
    var pdata;
    var data;
    var tmp;
    this.doApi('stopEditing');
    if (this.internalChange) {
      return;
    }
    this.internalChange = true;
    if (this.dataOriginals) {
      if (lib.isArray(this.get('data'))) {
        data = this.get('data').slice();
        tmp = this.dataOriginals.reduce(function(res, val, key) {
          var a = val[IsBlankRowKeyProperty];
          if (a) {
            res.blankRowIndex = key;
            return res;
          }
          if (key>res.maxIndex) {
            res.maxIndex = key;
          }
          return res;
        }, {maxIndex:-1, blankRowIndex:-1});
        if (tmp.maxIndex > data.length-1) {
          throw new Error('data len mismatch');
        }
        this.dataOriginals.traverse((val, recindex) => {
          if (recindex == tmp.blankRowIndex) {
            this.blankRowController.emptyRow();
            return;
          }
          data[recindex] = val;
        });
        this.purgeDataOriginals();
        this.set('data', data);
        tmp = null;
        data = null;
      }
      this.purgeDataOriginals();
    }
    pdata = this.pristineData;
    this.pristineData = null;
    if (pdata) {
      console.log('setting pristine data', pdata);
      this.set('data', pdata);
    }
    this.deletedRows = null;
    this.set('addedRowCount', 0);
    this.set('deletedRowCount', 0);
    setChangedByUser.call(this);
    this.internalChange = false;
  };
  function editundoer (rec, originalrec) {
    var prop;
    if (!(rec && originalrec)) {
      return;
    }
    for (prop in originalrec) {
      if (rec.hasOwnProperty(prop)) {
        rec[prop] = originalrec[prop];
      }
    }
  }
  EditableAgGridMixin.prototype.justUndoEdits = function () {
    var data;
    if (this.internalChange) {
      return;
    }
    if (!this.dataOriginals) {
      return;
    }    
    if (lib.isArray(this.data)) {
      data = this.data;
      this.dataOriginals.traverse(function (val, recindex) {
        editundoer(data[recindex], val);
      });
      data = null;
      return;
    }
    this.purgeDataOriginals();
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
  EditableAgGridMixin.prototype.getChangedRowsWithOriginalsWOChangedKeys = function (prefixsuffixobj, onlyedited) {
    var newdata = this.dataCleanOfChangedKeys(this.get('data'), true);
    var indices = this.dataOriginals.keys().sort(function (a,b) {return a - b});
    var lookupnames = onlyedited?this.editablepropnames:this.changeablepropnames;
    var i, rec, origrec, chng, ret;
    if (newdata.length != indices.length) {
      throw new lib.Error('LENGTH_MISMATCH', 'New data has '+newdata.length+' items, but it should have been '+indices.length+' items');
    }
    ret = [];
    for (i=0; i<indices.length; i++) {
      rec = newdata[i];
      origrec = this.dataOriginals.get(indices[i]);
      chng = this.changeablepropnames.reduce(origdataadder.bind(null, rec, origrec, prefixsuffixobj, lookupnames), 0);
      console.log('chng', chng);
      if (chng) {
        ret.push(rec);
      }
      rec = null;
      origrec = null;
    }
    prefixsuffixobj = null;
    lookupnames = null;
    return ret;
  };
  //options properties
  //start => inclusive start record index
  //end => inclusive end record index
  //prefix => for propertyname of original values
  //suffix => for propertyname of original values
  //clean => if changed keys should be removed
  EditableAgGridMixin.prototype.getRowsWithOriginals = function (options) {
    var data, start, end, lookupnames, i, rec, origrec, chng, ret;
    data = this.get('data');
    if (!lib.isArray(data)) {
      return null;
    }
    start = (options && lib.isNumber(options.start)) ? options.start : 0;
    if (start<0) {
      start = 0;
    }
    end = (options && lib.isNumber(options.end)) ? options.end : data.length-1;
    if (end>data.length-1) {
      end = data.length-1;
    }
    ret = [];
    lookupnames = this.changeablepropnames;
    for (i=0; i<=end; i++) {
      rec = data[i];
      origrec = this.dataOriginals.get(i);
      chng = this.changeablepropnames.reduce(origdataadder.bind(null, rec, origrec, options, lookupnames), 0);
      if (options.clean) {
        changedCleaner(false, ret, rec);
      } else {
        ret.push(rec);
      }
      rec = null;
      origrec = null;
    }
    options = null;
    lookupnames = null;
    return ret;
  };

  function origdataadder (rec, origrec, prefixsuffixobj, allowedpropnames, res, propname) {
    var pref = prefixsuffixobj ? (prefixsuffixobj.prefix || 'original') : 'original',
      suff = prefixsuffixobj ? (prefixsuffixobj.suffix || '') : '';
    if (origrec) {
      if ((rec[propname] !== origrec[propname]) && allowedpropnames.indexOf(propname)>-1) {
        res ++;
      }
      rec[pref+propname+suff] = origrec[propname];
      return res;
    }
    rec[pref+propname+suff] = rec[propname];
    return res;
  }

  
  EditableAgGridMixin.prototype.updateRowSync = function (index, record) {
    var rownode, coldefs, oldrec, oldrec4update, prop, coldef;
    var pk, pkfound, find4pk;
    pk = this.primaryKey;
    rownode = this.rowNodeForIndexOrRecord(index, record);
    if (!rownode) {
      return;
    }
    if (!this.gridApi) {
      return;
    }
    coldefs = this.deepCopyColumnDefs();
    if (!lib.isArray(coldefs)) {
      return;
    }
    oldrec = rownode.data;
    oldrec4update = lib.isFunction(oldrec.clone) ? oldrec.clone() : lib.extendShallow({}, oldrec);
    for (prop in record) {
      if (!record.hasOwnProperty(prop)) {
        continue;
      }
      if (record[prop] === oldrec[prop]) {
        continue;
      }
      if (pk && pk == prop) {
        pkfound = true;
      }
      coldef = outerlib.utils.columnDef.findRealColumnDefByFieldAndDeleteIt(coldefs, prop);
      if (!coldef){
        continue;
      }
      /**/
      oldrec4update[prop] = record[prop];
      this.onCellValueChanged ({
        synthetic: true,
        oldValue: oldrec[prop],
        newValue: record[prop],
        colDef: coldef,
        rowIndex: index,
        node: rownode,
        data: oldrec4update,
        api: this.gridApi
      });
      /**/
    }
    if (!pkfound) {
      this.data[index] = oldrec4update;
      rownode.setData(oldrec4update);
    }
  };
  function secondHasTheSameValuesAsFirst (first, second) {
    var fks = Object.keys(first);
    return lib.isEqual(first, lib.pick(second, fks));
  }
  EditableAgGridMixin.prototype.updateRowByPropValSync = function (propname, propval, data) {
    var recNindex = this.findRowAndIndexByPropVal(propname, propval);
    if (!(recNindex && recNindex.element)) {
      return;
    }
    this.updateRowSync(
      recNindex.index,
      data
    );
  };
  EditableAgGridMixin.prototype.upsertRowByPropValSync = function (propname, propval, data) {
    var recNindex = this.findRowIndexAndInsertIndexByPropVal(propname, propval), ia;
    if (!recNindex) {
      return;
    }
    if (!recNindex.element) {
      //if (lib.isNumber(recNindex.insertafter)) {
        ia = lib.isNumber(recNindex.insertafter) ? recNindex.insertafter : -1;
        this.insertRow(data, ia);
        if (this.blankRowController.hasPropertyValue(propname, propval)) {
          this.blankRowController.emptyRow();
        }
      //}
      return;
    }
    if (secondHasTheSameValuesAsFirst(data, recNindex.element)) {
      return;
    }
    this.updateRowSync(
      recNindex.index,
      data
    );
    this.refreshCells();
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
    rownode = this.rowNodeForIndexOrRecord(index, record);
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
  };

  EditableAgGridMixin.prototype.indexForNewRowFromBlank = function (row) {
    return null;
  };

  EditableAgGridMixin.prototype.snapshotPristineData = function () {
    this.pristineData = this.pristineData || this.get('data').reduce(plainCleaner, []);
  };

  EditableAgGridMixin.prototype.considerRowIndexForDeletion = function (index) {
    var dataoriginalkeysfordec;
    if (this.dataOriginals) {
      this.dataOriginals.remove(index);
      dataoriginalkeysfordec = this.dataOriginals.reduce(keyGEthan, {target: index, res: []}).res;
      dataoriginalkeysfordec.sort(function (a, b) {return a-b;})
      dataoriginalkeysfordec.forEach(decDataOriginal.bind(this));
    }
  };

  EditableAgGridMixin.prototype.considerDeletedRows = function (deletedrows) {
    var deletedpristinerows;
    if (lib.isNonEmptyArray(deletedrows)) {
      deletedpristinerows = deletedrows.reduce(deletedFromPristinePicker.bind(this), []);
      this.deletedRows = (this.deletedRows||[]).concat(deletedpristinerows);
      this.set('addedRowCount', this.get('addedRowCount')+deletedpristinerows.length-deletedrows.length);
      this.set('deletedRowCount', this.get('deletedRowCount')+deletedpristinerows.length);
      setChangedByUser.call(this);
    }
    return deletedrows;
  }

  EditableAgGridMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, EditableAgGridMixin
      , 'onCellValueChanged'
      , 'onRowValueChanged'
      , 'onKeyDownForEdit'
      , 'onCellEditingStarted'
      , 'onCellEditingStopped'
      , 'onSelectionChangedForEdit'
      , 'purgeDataOriginals'      
      , 'revertAllEdits'
      , 'justUndoEdits'
      , 'get_dataWOChangedKeys'
      , 'get_changedRowsWOChangedKeys'
      , 'dataCleanOfChangedKeys'
      , 'getChangedRows'
      , 'getChangedRowDeltas'
      , 'getChangedRowsWithOriginalsWOChangedKeys'
      , 'getRowsWithOriginals'
      , 'startBatchEdit'
      , 'endBatchEdit'
      , 'updateRowSync'
      , 'updateRowByPropValSync'
      , 'upsertRowByPropValSync'
      , 'updateConsecutiveRowsSync'
      , 'updateRow'
      , 'updateConsecutiveRows'
      , 'setDataValueRowNodeRecColDef'
      , 'indexForNewRowFromBlank'
      , 'snapshotPristineData'
      , 'considerRowIndexForDeletion'
      , 'considerDeletedRows'
    );
  }

  mylib.Editable = EditableAgGridMixin;

  function isEditableRelatedPropertyName (name) {
    if (name.substr(0, ChangedKeyPrefix.length) == ChangedKeyPrefix) {
      return true;
    }
    if (name.substr(-ChangedKeySuffix.length) == ChangedKeySuffix) {
      return true;
    }
    return false;
  }
  function noChanged (record) {
    return !lib.traverseShallowConditionally(record, changedDetector);
  }
  function changedDetector (val, name) {
    if (!isEditableRelatedPropertyName(name)) {
      return;
    }
    if (lib.isVal(val)) {
      return true;
    }
  }
  function changedCleaner (onlyedited, res, record) {
    if (onlyedited && noChanged(record)) {
      return res;
    }
    return plainCleaner(res, record);
  }
  function plainCleaner (res, record) {
    var ret, prop;
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
    if (!lib.isArray(allrows)) {
      return;
    }
    var rec = allrows[changedindex];
    if (!rec) {
      return;
    }
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
      deltas[prop] = this[onlyeditable ? 'editablepropnames' : 'changeablepropnames'].indexOf(prop)>=0 ? rec[prop]-origrow[prop] : origrow[prop];
      /*
      deltas[prop] = onlyeditable 
      ?
      rec[prop]-origrow[prop]
      :
      ( this.changeablepropnames.indexOf(prop)>=0 ? rec[prop]-origrow[prop] : origrow[prop] )
      */
      ;
    }
    changedrows.push(deltas);
  }
  function compareObjsWOChangedKeys (a, b) {
    var prop;
    for(prop in a) {
      if (!a.hasOwnProperty(prop)) {
        continue;
      }
      if (changeKeyDetector(prop)){
        continue;
      }
      if (!lib.isEqual(a[prop], b[prop])) {
        return false;
      }
    }
    return true;
  }
  function arryRecognizes (arry, obj) {
    var ret = arry.some(compareObjsWOChangedKeys.bind(null, obj));
    obj = null;
    return ret;
  }
  function keyGEthan (res, val, key) {
    if (key>=res.target) {
      res.res.push(key);
    }
    return res;
  }

  //statics
  function setChangedByUser () {
    this.set('changedByUser', 
      this.get('editedCellCount')!=0
      || this.get('changedCellCount')!=0
      || this.get('addedRowCount')!=0
      || this.get('deletedRowCount')!=0
    );
  }
  function addNewRowFromBlank (create_new, newrow) {
    var newrowindex, newdata, blankcontrollerrow, dataoriginalkeysforbumping;
    if (create_new) {
      this.snapshotPristineData();
      this.internalChange = true;
      newrowindex = this.indexForNewRowFromBlank(newrow);
      if (lib.isNumber(newrowindex)) {
        this.addedRowAtIndex = newrowindex;
        newdata = this.get('data').slice();
        newdata.splice(newrowindex, 0, newrow);        
      } else {
        this.addedRowAtIndex = this.blankRowController.config.position=='bottom'
        ?
        this.get('data').length
        :
        0;
        newdata = this.blankRowController.config.position=='bottom'
        ?
        this.get('data').slice().concat([newrow])
        :
        [newrow].concat(this.get('data'));
      }
      this.doApi('stopEditing');
      if (this.dataOriginals) {
        blankcontrollerrow = this.blankRowController.rowNode.rowIndex;
        this.dataOriginals.remove(blankcontrollerrow);
        dataoriginalkeysforbumping = this.dataOriginals.reduce(keyGEthan, {target: blankcontrollerrow, res: []}).res;
        dataoriginalkeysforbumping.sort(function (a, b) {return b-a;})
        dataoriginalkeysforbumping.forEach(bumpDataOriginal.bind(this));
      }
      this.set(
        'data', 
        newdata
      ); //loud, with 'data' listeners being triggered
      this.set('addedRowCount', this.get('addedRowCount')+1);
      this.blankRowController.startEditing();
      //lib.runNext(startEditingCell.bind(this));
    }
    setChangedByUser.call(this);
    this.internalChange = false;
    this.newRowAdded.fire(newrow);
  }
  /*
  function startEditingCell () {
    this.blankRowController.startEditing();
  }
  */
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
  function deletedFromPristinePicker (res, delrow) {
    if (this.pristineData && arryRecognizes(this.pristineData, delrow)) {
      res.push(delrow);
    }
    return res;
  }
  function decDataOriginal (index) {
    this.dataOriginals.add(index-1, this.dataOriginals.remove(index));
  }
  function bumpDataOriginal (index) {
    this.dataOriginals.add(index+1, this.dataOriginals.remove(index));
  }
  function nextCellProc (params) {
    if (!params.nextCellPosition) {
      if (this.cellEditingStopped) {
        this.cellEditingStopped = false;
      }
      this.blankRowController.ifEditFinished(null, isEditableRelatedPropertyName, addNewRowFromBlank.bind(this));
      if (!this.blankRowController.rowNode) {
        return null;
      }
      return {
        rowPinned: params.previousCellPosition.rowPinned,
        rowIndex: this.blankRowController.rowNode.rowIndex,
        column: lib.isNonEmptyArray(this.editablepropnames) ? params.columnApi.getColumn(this.editablepropnames[0]) : params.previousCellPosition.column
      };
    }
    return params.nextCellPosition; //||params.previousCellPosition;
  }
  //endof statics

  //setValues on editobj
  //statics on editobj
  function setValues (rec) {
    var editor = editorWithin.call(this, rec);
    lib.traverseShallow(rec, dataSetter.bind(this));
    if (editor) {
      if (lib.isFunction(editor.setEditValueFromRecord)) {
        editor.setEditValueFromRecord(rec);
      } else {
        editor.cellEditorInput.eInput.setValue(rec[editor.params.column.colId]);
      }
    }
  }
  function dataSetter (val, key) {
    this.data[key] = val;
    this.node.setDataValue(key, val);
  }
  function editorWithin (rec) {
    var editors = this.api.getCellEditorInstances();
    var findobj = {row: this.rowIndex, propnames: Object.keys(rec), res: null};
    var ret;
    editors.some(isContainedInEditedCell.bind(null, findobj));
    ret = findobj.res;
    findobj = null;
    return ret;
  }
  //endof statics on editobj
  function isContainedInEditedCell (findobj, editor) {
    if (!editor) {return;}
    var isfound = (lib.isFunction(editor.matchesRowAndColumnNames)
    ?
    editor.matchesRowAndColumnNames(findobj.row, findobj.propnames)
    :
    findobj.row == editor.params.rowIndex && findobj.propnames.indexOf(editor.params.column.colId)>=0
    );
    if (isfound) {
      findobj.res = editor;
      return true;
    }
  }
  //endof setValues on editobj
}
module.exports = createEditableMixin;