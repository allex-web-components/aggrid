function createGrid (execlib, applib, mylib) {
  'use strict';
  
  var lib = execlib.lib,
    fullWidthRowLib = require('./fullwidthrowmanagers')(execlib, applib, mylib),
    WebElement = applib.getElementType('WebElement');

  var lR = execlib.execSuite.libRegistry;
  var arryopslib = lR.get('allex_arrayoperationslib');

  function AgGridElement (id, options) {
    this.gridApi = null;
    this.fullWidthRowManagers = null;
    this.optionLevelHandlers = new lib.Map();
    this.validityMonitor = new mylib.utils.ValidityMonitor(this);
    this.checkOptions(options);
    WebElement.call(this, id, options);
    mylib.gridmixins.ContextMenuable.call(this, options);
    mylib.gridmixins.Exportable.call(this, options);
    mylib.gridmixins.Themable.call(this, options);
    this.data = [];
    this.blankRowController = new mylib.utils.BlankRowController(this, options.blankRow);
    this.selections = new lib.Map();
    this.rowDblClicked = this.createBufferableHookCollection();
    this.rowSelected = this.createBufferableHookCollection();
    this.rowUnselected = this.createBufferableHookCollection();
    this.masterRowExpanding = this.createBufferableHookCollection();
    this.masterRowCollapsing = this.createBufferableHookCollection();
    this.selectedRows = null;
    this.valid = true;
  }
  lib.inherit(AgGridElement, WebElement);
  mylib.gridmixins.ContextMenuable.addMethods(AgGridElement);
  mylib.gridmixins.Exportable.addMethods(AgGridElement);
  mylib.gridmixins.Themable.addMethods(AgGridElement);
  AgGridElement.prototype.__cleanUp = function () {
    this.valid = null;
    this.selectedRows = null;
    if (this.masterRowCollapsing) {
      this.masterRowCollapsing.destroy();
    }
    this.masterRowCollapsing = null;
    if (this.masterRowExpanding) {
      this.masterRowExpanding.destroy();
    }
    this.masterRowExpanding = null;
    if (this.rowUnselected) {
      this.rowUnselected.destroy();
    }
    this.rowUnselected = null;
    if (this.rowSelected) {
      this.rowSelected.destroy();
    }
    this.rowSelected = null;
    if(this.rowDblClicked) {
       this.rowDblClicked.destroy();
    }
    this.rowDblClicked = null;
    if (this.selections) {
      this.selections.destroy();
    }
    this.selections = null;
    if(this.blankRowController) {
       this.blankRowController.destroy();
    }
    this.blankRowController = null;
    this.data = null;
    if (this.getConfigVal('aggrid') && lib.isFunction(this.getConfigVal('aggrid').destroy)) {
      this.getConfigVal('aggrid').destroy();
    }
    mylib.gridmixins.Themable.prototype.destroy.call(this);
    mylib.gridmixins.Exportable.prototype.destroy.call(this);
    mylib.gridmixins.ContextMenuable.prototype.destroy.call(this);
    WebElement.prototype.__cleanUp.call(this);
    if(this.validityMonitor) {
      this.validityMonitor.destroy();
    }
    this.validityMonitor = null;
    if (lib.isArray(this.fullWidthRowManagers)){
      lib.arryDestroyAll(this.fullWidthRowManagers);
    }
    if (this.optionLevelHandlers) {
      this.optionLevelHandlers.destroy();
    }
    this.optionLevelHandlers = null;
    this.fullWidthRowManagers = null;
    if(this.gridApi) {
      this.gridApi.destroy();
    }
    this.gridApi = null;
  };
  AgGridElement.prototype.doThejQueryCreation = function () {
    var runtimeconfobj = {};
    WebElement.prototype.doThejQueryCreation.call(this);
    this.makeUpRunTimeConfiguration(runtimeconfobj);
    if (this.$element && this.$element.length) {
      this.gridApi = agGrid.createGrid(this.$element[0], lib.extend(this.getConfigVal('aggrid'), runtimeconfobj));
      this.listenForContextMenu();
      this.onAgGridElementCreated();
      /*
      new agGrid.Grid(this.$element[0], lib.extend(this.getConfigVal('aggrid'), {
        onRowSelected: this.onAnySelection.bind(this, 'row'),
        onCellValueChanged: this.onCellValueChanger
      }));
      //this.getConfigVal('aggrid').api.addEventListener('cellValueChanged', this.onCellValueChanger);
      this.set('data', this.getConfigVal('data'));
      */
    }
  };
  AgGridElement.prototype.staticEnvironmentDescriptor = function (myname) {
    return lib.extendWithConcat(
      WebElement.prototype.staticEnvironmentDescriptor.call(this, myname)||{},
      mylib.gridmixins.Themable.prototype.staticEnvironmentDescriptor.call(this, myname),
      {}
    );
  };
  /*
  function freezer (obj) {
    return lib.pickExcept(obj, []);
  }
  function frozenarry (arry) {
    return lib.isArray(arry) ? arry.map(freezer) : arry;
  }
  */
  AgGridElement.prototype.set_data = function (data) {
    var edits, checkedits;
    if (data == this.data) {
      return false;
    }
    edits = this.lastEditedCellsBeforeSetData || this.doApi('getEditingCells');
    this.__children.traverse(function (chld) {
      chld.destroy();
    });
    this.data = data;
    this.doApi('setGridOption', 'rowData', data);
    if (!lib.isArray(data)) {
      this.doApi('showLoadingOverlay');
    }
    this.blankRowController.onSetData();
    this.refresh();
    if (edits && edits.length>0) {
      edits.forEach(editStarter.bind(this));
      checkedits = this.doApi('getEditingCells');
      this.lastEditedCellsBeforeSetData = (edits.length != checkedits.length) ? edits : null;
    }
    return true;
  };
  //static
  function editStarter(cellposition) {
    var indcorr = lib.isNumber(this.addedRowAtIndex) ? this.addedRowAtIndex : Infinity;
    var finalrowindex;
    this.addedRowAtIndex = null;
    if ((this.get('data')||[]).length<=cellposition.rowIndex) {
      console.log('startEditingCell skipped on row', cellposition.rowIndex, 'because data len', (this.get('data')||[]).length);
      return;
    }
    finalrowindex = cellposition.rowIndex>=indcorr ? cellposition.rowIndex+1 : cellposition.rowIndex;
    console.log('starting edit on rowIndex', finalrowindex, 'because original rowIndex', cellposition.rowIndex, 'and corr', indcorr);
    this.doApi('startEditingCell', {
      rowIndex: finalrowindex,
      colKey: cellposition.column,
      rowPinned: cellposition.rowPinned
    });
  }
  //endof static
  //helpers
  function selectedRowCounter (obj, node) {
    if (node.isSelected()) {
      obj.selectedcnt++;
    }
  }
  //endof helpers
  AgGridElement.prototype.get_selectedRowCount = function () { //read-only
    var obj = {selectedcnt: 0}, ret;
    this.doApi('forEachNodeAfterFilterAndSort', selectedRowCounter.bind(null, obj));
    ret = obj.selectedcnt;
    obj = null;
    return ret;
  }
  AgGridElement.prototype.get_pinnedBottom = function (datarecords) {
    var aggridopts = this.getConfigVal('aggrid');
    return aggridopts ? aggridopts.pinnedBottomRowData : null;
  };
  AgGridElement.prototype.set_pinnedBottom = function (datarecords) {
    this.doApi('setPinnedBottomRowData', datarecords);
  };
  AgGridElement.prototype.get_columnDefs = function () {
    var aggridopts = this.getConfigVal('aggrid');
    if (!aggridopts) {
      return null;
    }
    return aggridopts.columnDefs;
  };
  AgGridElement.prototype.set_columnDefs = function (coldefs) {
    try {
      this.checkColumnDefs(coldefs);
    } catch (e) {
      console.error(e);
      return false;
    }
    this.doApi('setGridOption', 'columnDefs', coldefs);
    return true;
  };
  AgGridElement.prototype.refresh = function () {
    this.doApi('refreshHeader');
    //this.doColumnApi('autoSizeAllColumns');
  };
  AgGridElement.prototype.refreshCells = function () {
    this.doApi('refreshCells', {
      suppressFlash: true
    });
  };
  AgGridElement.prototype.queueRefresh = function () {
    lib.runNext(this.refresh.bind(this), 100);
  };
  AgGridElement.prototype.findRowAndIndexByPropVal = function (propname, propval) {
    return arryopslib.findElementAndIndexWithProperty(this.get('data'), propname, propval);
  };
  AgGridElement.prototype.findRowIndexAndInsertIndexByPropVal = function (propname, propval) {
    return arryopslib.findElementIndexAndInsertIndexWithProperty(this.get('data'), propname, propval);
  };
  AgGridElement.prototype.addRow = function (rec) {
    this.set('data', (this.get('data')||[]).concat([rec||{}]));
  };
  AgGridElement.prototype.addRowSoft = function (rec) {
    return this.doApi('applyTransaction', {add: [rec]}).add[0];
  };
  AgGridElement.prototype.insertRow = function (rec, afterindex) {
    var data;
    data = (this.get('data')||[]).slice();
    data.splice((afterindex||0)+1, 0, rec);
    this.data = data;
    this.blankRowController.prepareForInsert(rec);
    //console.log('new data', data);
    //this.doApi('setGridOption', 'rowData', data);
    this.doApi('applyTransaction', {add: [rec], addIndex: (afterindex||0)+1});
    this.blankRowController.ackInsertedRow(rec);
    this.refreshCells();
    //lib.runNext(this.refresh.bind(this));
  };
  AgGridElement.prototype.removeRow = function (rec, atindex) {
    var ret;
    if (lib.isNumber(atindex)) {
      ret = (this.get('data')||[]).splice(atindex, 1);
    }
    this.doApi('applyTransaction', {remove: [rec]});
    return ret;
  };
  AgGridElement.prototype.removeRowByPropValue = function (propname, propval) {
    var recNindex = this.findRowAndIndexByPropVal(propname, propval);
    if (!(recNindex && recNindex.element)) {
      return;
    }
    this.removeRow(recNindex.element, recNindex.originalindex||recNindex.index);
  };
  AgGridElement.prototype.removeRowPlain = function (rec) {
    this.removeRow(rec, this.get('data').indexOf(rec));
  };
  AgGridElement.prototype.removeRowPlainLoud = function (rec) {
    this.removeRow(rec, this.get('data').indexOf(rec));
    this.set('data', this.get('data').slice());
  };
  AgGridElement.prototype.onGridRowDblClicked = function (evntdata) {
    this.rowDblClicked.fire(evntdata);
  };
  AgGridElement.prototype.onAnySelection = function (typename, evntdata) {
    var selected = evntdata.node.selected, suffix = selected ? 'Selected' : 'Unselected', prevselected, aggridopts;
    if (selected) {
      prevselected = this.selections.replace(typename, evntdata.data);
      aggridopts = this.getConfigVal('aggrid');
      if (
        aggridopts && 
        aggridopts.rowSelection=='single' && 
        prevselected
      ) {
        this[typename+'Unselected'].fire(prevselected);
      }
    } else {
      if (this.selections.get(typename) != evntdata.data) {
        return;
      }
    }
    this[typename+suffix].fire(evntdata.data);
  };

  function nodeFinder(findobj, node) {
    if (findobj.index == node.rowIndex) {
      findobj.ret = node;
    }
  }
  AgGridElement.prototype.rowNodeForIndexOrRecord = function (index, record) {
    var model = this.doApi('getModel'), ret, findobj;
    if (!model) {
      return null;
    }
    if (this.primaryKey) {
      ret = model.getRowNode(record[this.primaryKey]);
      if (ret) {
        return ret;
      }
      findobj = {index: index, ret: null};
      this.doApi('forEachNode', nodeFinder.bind(null, findobj));
      ret = findobj.ret;
      findobj = null;
      return ret;
  }
    return model.getRowNode(index);
  };
  AgGridElement.prototype.rowNodeForDataRow = function (row) {
    var index;
    if (!(lib.isArray(this.data) && this.data.length>0)) {
      return null;
    }
    if (this.primaryKey) {
      return this.rowNodeForIndexOrRecord(null, row);
    }
    index = this.data.indexOf(row);
    return index<0 ? null : this.rowNodeForIndexOrRecord(index);
  };
  AgGridElement.prototype.selectDataRow = function (row) {
    var node = this.rowNodeForDataRow(row);
    if (!node) {
      return;
    }
    node.setSelected(true);
  };

  AgGridElement.prototype.doApi = function (fnname) {
    if (!this.gridApi) {
      return;
    }
    return this.gridApi[fnname].apply(this.gridApi, Array.prototype.slice.call(arguments, 1));
  };
  AgGridElement.prototype.doColumnApi = function (fnname) {
    var aggridopts = this.getConfigVal('aggrid');
    if (!aggridopts) {
      return;
    }
    if (!aggridopts.api) {
      return;
    }
    aggridopts.columnApi[fnname].apply(aggridopts.api, Array.prototype.slice.call(arguments, 1));
  };

  AgGridElement.prototype.setDetailRowProperty = function (obj) {
    if (!(obj && obj.fetchObject && obj.destProperty && obj.srcProperty)) {
      return;
    }
    var srcpropval = obj.fetchObject[obj.srcProperty];
    var el = this.__children.traverseConditionally(function (chld) {
      var prop = lib.readPropertyFromDotDelimitedString(chld, obj.rowDataProperty);
      if (lib.isEqual(prop, srcpropval)) {
        chld.set(obj.destProperty, obj.value);
        return chld;
      }
    });
    srcpropval = null;
    obj = null;
  };

  AgGridElement.prototype.deepCopyColumnDefs = function () {
    return mylib.utils.columnDef.deepCopy(this.get('columnDefs'));
  };

  AgGridElement.prototype.forEachRealColumnDef = function (cb) {
    mylib.utils.columnDef.forEachRealColumnDef(this.get('columnDefs'), cb);
  };

  AgGridElement.prototype.reduceRealColumnDefs = function (cb, initvalue) {
    return mylib.utils.columnDef.reduceRealColumnDefs(this.get('columnDefs'), cb, initvalue);
  };


  AgGridElement.prototype.makeUpRunTimeConfiguration = function (obj) {
    this.setAgGridHandler(obj, 'onRowDoubleClicked', this.onGridRowDblClicked.bind(this));
    this.setAgGridHandler(obj, 'onRowSelected', this.onAnySelection.bind(this, 'row'));
    this.setAgGridHandler(obj, 'onRowUnselected', this.onAnySelection.bind(this, 'row'));
  };
  AgGridElement.prototype.onAgGridElementCreated = function () {
    this.set('data', this.getConfigVal('data'));
  };

  AgGridElement.prototype.checkOptions = function (options) {
    var gridconf;
    if (!options) {
      throw new lib.Error('NO_OPTIONS', 'options must exist');
    }
    if (!options.aggrid) {
      throw new lib.Error('NO_OPTIONS_AGGRID', 'options must have "aggrid" config object');
    }
    gridconf = options.aggrid;
    this.setAgGridHandler(gridconf, 'onSelectionChanged', this.onSelectionChanged.bind(this));
    if (options.blankRow) {
      gridconf.rowSelection = gridconf.rowSelection || 'single';
    }

    this.checkColumnDefs(gridconf.columnDefs);
    gridconf.rowData = gridconf.rowData || [];
    this.fullWidthRowManagers = fullWidthRowLib.createFullWidthRowManagers(this, options);
    if (this.fullWidthRowManagers) {
      gridconf.isFullWidthCell = this.isFullWidthCell.bind(this);
      gridconf.fullWidthCellRenderer = this.fullWidthCellRenderer.bind(this);
    }
  };
  function multiHandler (funcs, evnt) {
    var i;
    if (!lib.isArray(funcs)) {
      return;
    }
    funcs.forEach(function (func) {if (lib.isFunction(func)) func(evnt);});
  }
  AgGridElement.prototype.setAgGridHandler = function (gridconf, name, handler) {
    var h = this.optionLevelHandlers.get(name);
    if (!h) {
      h = [];
      this.optionLevelHandlers.add(name, h);
    }
    h.push(handler);
    if (!gridconf[name]) {
      gridconf[name] = multiHandler.bind(null, h);
    }
  };
  AgGridElement.prototype.checkColumnDefs = function (columndefs) {
    if (!lib.isArray(columndefs)) {
      throw new lib.Error('NO_GRIDCONFIG_COLUMNS', 'options.aggrid must have "columnDefs" as an Array of column Objects');
    }
    if (!columndefs.every(isColumnOk.bind(this))) {
      throw new lib.Error('INVALID_COLUMN_OBJECT', 'column Object must have field "field" or "colId" or "valueGetter');
    }
  };
  AgGridElement.prototype.onSelectionChanged = function (evnt) {
    if (!(evnt && evnt.api)) {
      return;
    }
    var selnodes = evnt.api.getSelectedNodes();
    var areselnodesarry = lib.isArray(selnodes);
    var selnode = (areselnodesarry && selnodes.length>0) ? selnodes[selnodes.length-1] : null;
    this.set('selectedRows', areselnodesarry ? selnodes.reduce(dataer, []) : []);
  };
  AgGridElement.prototype.isFullWidthCell = function (rownode) {
    var ret;
    if (!lib.isArray(this.fullWidthRowManagers)) {
      return false;
    }
    ret = this.fullWidthRowManagers.some(function (m) {return m.isFullWidthRow(rownode);});
    rownode = null;
    return ret;
  };
  AgGridElement.prototype.fullWidthCellRenderer = function (params) {
    //console.log('fullWidthCellRenderer?', params);
    if (!(
      params && 
      params.data && 
      params.data.allexAgFullWidthRowInfo &&
      params.data.allexAgFullWidthRowInfo.instance))
    {
      return null;
    }
    return params.data.allexAgFullWidthRowInfo.instance.render(params);
  };

  AgGridElement.prototype.indexOfObjectInData = function (object) {
    var arry = this.data, ret, tmp;
    for (ret = 0; ret<arry.length; ret++) {
      tmp = arry[ret];
      if (lib.isEqual(tmp, object)) {
        return ret;
      }
    }
    return -1;
  };

  function dataer (res, node) {
    if (node && node.data) {
      res.push(node.data);
    }
    return res;
  }

  function isColumnOk (obj) {
    var name, params, fmter, prser;
    if (!obj) return false;
    if (lib.isArray(obj.children)) return obj.children.every(isColumnOk.bind(this));
    if (obj.valueFormatter && !lib.isFunction(obj.valueFormatter)) {
      name = obj.valueFormatter.name;
      if (!name) {
        throw new lib.Error('INVALID_COLUMN_OBJECT', 'column Object has valueFormatter as Object but without "name"');
      }
      params = obj.valueFormatter;
      fmter = mylib.formatters[name];
      if (!fmter) {
        throw new lib.Error('INVALID_COLUMN_OBJECT', 'column Object has valueFormatter as Object but "name" '+obj.valueFormatter.name+' does not map to a registered Formatter name');
      }
      obj.valueFormatter = fmter.bind(null, params);
      prser = mylib.parsers[name];
      if (prser) {
        obj.valueParser = prser.bind(null, params);
      }
    }
    if (obj.cellClassRules && obj.cellClassRules.invalid) {
      obj.cellClassRules.invalid = this.validityMonitor.addParticular(obj.field, obj.cellClassRules.invalid)
    }
    return lib.isString(obj.field) || lib.isVal(obj.colId) || lib.isVal(obj.valueGetter);
  }

  AgGridElement.prototype.respondToThemeChange = function (oldtheme, newtheme) {
    this.$element.removeClass(oldtheme);
    this.$element.addClass(newtheme);
  };

  applib.registerElementType('AgGrid', AgGridElement);

  function EditableAgGridElement (id, options) {
    AgGridElement.call(this, id, options);
    mylib.gridmixins.Editable.call(this, options);
  }
  lib.inherit(EditableAgGridElement, AgGridElement);
  mylib.gridmixins.Editable.addMethods(EditableAgGridElement);
  EditableAgGridElement.prototype.__cleanUp = function () {
    mylib.gridmixins.Editable.prototype.destroy.call(this);
    AgGridElement.prototype.__cleanUp.call(this);
  };
  EditableAgGridElement.prototype.makeUpRunTimeConfiguration = function (obj) {
    AgGridElement.prototype.makeUpRunTimeConfiguration.call(this, obj);
    mylib.gridmixins.Editable.prototype.makeUpRunTimeConfiguration.call(this, obj);
  };
  /*
  EditableAgGridElement.prototype.onAgGridElementCreated = function () {
      //this.getConfigVal('aggrid').api.addEventListener('cellValueChanged', this.onCellValueChanger);
    AgGridElement.prototype.onAgGridElementCreated.call(this);
  };
  */
  EditableAgGridElement.prototype.set_data = function (data) {
    this.justUndoEdits();
    this.revertAllEdits();
    return AgGridElement.prototype.set_data.call(this, data);
  };
  EditableAgGridElement.prototype.removeRow = function (rec, atindex) {
    var deleted;
    this.snapshotPristineData();
    this.considerRowIndexForDeletion(atindex);
    deleted = AgGridElement.prototype.removeRow.call(this, rec, atindex);
    this.considerDeletedRows(deleted);
    return deleted;
  };

  applib.registerElementType('EditableAgGrid', EditableAgGridElement);

  function EditableTableAgGridElement (id, options) {
    EditableAgGridElement.call(this, id, options);
    mylib.gridmixins.Table.call(this, options);
  }
  lib.inherit(EditableTableAgGridElement, EditableAgGridElement);
  mylib.gridmixins.Table.addMethods(EditableTableAgGridElement, EditableAgGridElement);
  EditableTableAgGridElement.prototype.__cleanUp = function () {
    mylib.gridmixins.Table.prototype.destroy.call(this);
    EditableAgGridElement.prototype.__cleanUp.call(this);
  };
  EditableTableAgGridElement.prototype.makeUpRunTimeConfiguration = function (obj) {
    EditableAgGridElement.prototype.makeUpRunTimeConfiguration.call(this, obj);
    mylib.gridmixins.Table.prototype.makeUpRunTimeConfiguration.call(this, obj);
  };

  applib.registerElementType('EditableTableAgGrid', EditableTableAgGridElement);
}
module.exports = createGrid;
