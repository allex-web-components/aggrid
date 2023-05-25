function createGrid (execlib, applib, mylib) {
  'use strict';
  
  var lib = execlib.lib,
    fullWidthRowLib = require('./fullwidthrowmanagers')(execlib, applib, mylib),
    WebElement = applib.getElementType('WebElement');

  function AgGridElement (id, options) {
    this.fullWidthRowManagers = null;
    this.checkOptions(options);
    WebElement.call(this, id, options);
    mylib.gridmixins.ContextMenuable.call(this, options);
    this.data = null;
    this.selections = new lib.Map();
    this.rowSelected = this.createBufferableHookCollection();
    this.rowUnselected = this.createBufferableHookCollection();
    this.masterRowExpanding = this.createBufferableHookCollection();
    this.masterRowCollapsing = this.createBufferableHookCollection();
  }
  lib.inherit(AgGridElement, WebElement);
  mylib.gridmixins.ContextMenuable.addMethods(AgGridElement);
  AgGridElement.prototype.__cleanUp = function () {
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
    if (this.selections) {
      this.selections.destroy();
    }
    this.selections = null;
    this.data = null;
    if (this.getConfigVal('aggrid') && lib.isFunction(this.getConfigVal('aggrid').destroy)) {
      this.getConfigVal('aggrid').destroy();
    }
    mylib.gridmixins.ContextMenuable.prototype.destroy.call(this);
    WebElement.prototype.__cleanUp.call(this);
    if (lib.isArray(this.fullWidthRowManagers)){
      lib.arryDestroyAll(this.fullWidthRowManagers);
    }
    this.fullWidthRowManagers = null;
  };
  AgGridElement.prototype.doThejQueryCreation = function () {
    var runtimeconfobj = {};
    WebElement.prototype.doThejQueryCreation.call(this);
    this.makeUpRunTimeConfiguration(runtimeconfobj);
    if (this.$element && this.$element.length) {
      new agGrid.Grid(this.$element[0], lib.extend(this.getConfigVal('aggrid'), runtimeconfobj));
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
  AgGridElement.prototype.set_data = function (data) {
    //data = this.dataCleanOfChangedKeys(data);
    this.data = data;
    this.__children.traverse(function (chld) {
      chld.destroy();
    });
    this.doApi('setRowData', data); 
    if (!lib.isArray(data)) {
      this.doApi('showLoadingOverlay');
    }
    if (this.getConfigVal('blankRow')) {
      this.doApi('applyTransaction', {add: [mylib.utils.blankRow.new()]});
    }
    this.refresh();
  };
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
    this.doApi('setColumnDefs', coldefs);
    return true;
  };
  AgGridElement.prototype.refresh = function () {
    this.doApi('refreshHeader');
    //this.doColumnApi('autoSizeAllColumns');
  };
  AgGridElement.prototype.queueRefresh = function () {
    lib.runNext(this.refresh.bind(this), 100);
  };
  AgGridElement.prototype.addRow = function (rec) {
    this.set('data', (this.get('data')||[]).concat([rec||{}]));
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

  AgGridElement.prototype.rowNodeForIndex = function (index) {
    var model = this.doApi('getModel');
    if (!model) {
      return null;
    }
    return model.getRowNode(index);
  };
  AgGridElement.prototype.rowNodeForDataRow = function (row) {
    var index;
    if (!(lib.isArray(this.data) && this.data.length>0)) {
      return null;
    }
    index = this.data.indexOf(row);
    return index<0 ? null : this.rowNodeForIndex(index);
  };
  AgGridElement.prototype.selectDataRow = function (row) {
    var node = this.rowNodeForDataRow(row);
    if (!node) {
      return;
    }
    node.setSelected(true);
  };

  AgGridElement.prototype.doApi = function (fnname) {
    var aggridopts = this.getConfigVal('aggrid');
    if (!aggridopts) {
      return;
    }
    if (!aggridopts.api) {
      return;
    }
    return aggridopts.api[fnname].apply(aggridopts.api, Array.prototype.slice.call(arguments, 1));
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
    obj.onRowSelected = this.onAnySelection.bind(this, 'row');
    obj.onRowUnselected = this.onAnySelection.bind(this, 'row');
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
    this.checkColumnDefs(gridconf.columnDefs);
    gridconf.rowData = gridconf.rowData || [];
    this.fullWidthRowManagers = fullWidthRowLib.createFullWidthRowManagers(this, options);
    if (this.fullWidthRowManagers) {
      gridconf.isFullWidthCell = this.isFullWidthCell.bind(this);
      gridconf.fullWidthCellRenderer = this.fullWidthCellRenderer.bind(this);
    }
  };
  AgGridElement.prototype.checkColumnDefs = function (columndefs) {
    if (!lib.isArray(columndefs)) {
      throw new lib.Error('NO_GRIDCONFIG_COLUMNS', 'options.aggrid must have "columnDefs" as an Array of column Objects');
    }
    if (!columndefs.every(isColumnOk)) {
      throw new lib.Error('INVALID_COLUMN_OBJECT', 'column Object must have field "field" or "colId" or "valueGetter');
    }
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


  function isColumnOk (obj) {
    var name, params, fmter, prser;
    if (!obj) return false;
    if (lib.isArray(obj.children)) return obj.children.every(isColumnOk);
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
    return lib.isString(obj.field) || lib.isVal(obj.colId) || lib.isVal(obj.valueGetter);
  }

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
  EditableAgGridElement.prototype.onAgGridElementCreated = function () {
      //this.getConfigVal('aggrid').api.addEventListener('cellValueChanged', this.onCellValueChanger);
    AgGridElement.prototype.onAgGridElementCreated.call(this);
  };
  EditableAgGridElement.prototype.set_data = function (data) {
    this.justUndoEdits();
    this.revertAllEdits();
    return AgGridElement.prototype.set_data.call(this, data);
  };

  applib.registerElementType('EditableAgGrid', EditableAgGridElement);
}
module.exports = createGrid;
