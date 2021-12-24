(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function createChart (execlib, applib, mylib) {
  'use strict';

  var lib = execlib.lib,
    WebElement = applib.getElementType('WebElement');

  function AgChartElement (id, options) {
    WebElement.call(this, id, options);
    this.data = null;
    this.chartOpts = null;
    this.chart = null;
  }
  lib.inherit(AgChartElement, WebElement);
  AgChartElement.prototype.__cleanUp = function () {
    this.chartOpts = null;
    this.data = null;
    WebElement.prototype.__cleanUp.call(this);
  };
  AgChartElement.prototype.doThejQueryCreation = function () {
    WebElement.prototype.doThejQueryCreation.call(this);
    if (this.$element && this.$element.length) {
      this.chartOpts = lib.extend({
        container: this.$element[0],
      }, this.getConfigVal('agchart'),{
        data: []
      });
      console.log('agcreatopts', this.chartOpts);
      this.chart = agCharts.AgChart.create(this.chartOpts);
      //this.set('data', this.getConfigVal('data'));
    }
  };
  AgChartElement.prototype.set_data = function (data) {
    var agchartopts;
    this.data = data;
    if (!this.chart) {
      return true;
    }
    this.chartOpts.data = data;
    this.apiUpdate();
    return true;
  };
  AgChartElement.prototype.get_series = function () {
    return this.chartOpts ? this.chartOpts.series : null;
  };
  AgChartElement.prototype.set_series = function (series) {
    if (!this.chartOpts) {
      return true;
    }
    this.chartOpts.series = series;
    this.apiUpdate();
    return true;
  };
  AgChartElement.prototype.get_titletext = function () {
    return this.chartOpts ? 
      (this.chartOpts.title ? this.chartOpts.title.text : null)
      :
      null;
  };
  AgChartElement.prototype.set_titletext = function (titletext) {
    this.chartOpts.title = this.chartOpts.title || {};
    this.chartOpts.title.text = titletext||'';
    this.apiUpdate();
    return true;
  };
  AgChartElement.prototype.apiUpdate = function () {
    agCharts.AgChart.update(this.chart, this.chartOpts);
  };

  applib.registerElementType('AgChart', AgChartElement);
}
module.exports = createChart;

},{}],2:[function(require,module,exports){
function createFullWidthRowManagerBase (execlib, applib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function FullWidthRowManagerBase (gridel, options) {
    this.gridEl = gridel;
    this.options = options;
    this.gridconf = options.aggrid;
  }
  FullWidthRowManagerBase.prototype.destroy = function () {
    this.gridconf = null;
    this.options = null;
    this.gridEl = null;
  };
  FullWidthRowManagerBase.prototype.isFullWidthRow = function (rownode) {
    return rownode &&
      rownode.data &&
      rownode.data.allexAgFullWidthRowInfo &&
      rownode.data.allexAgFullWidthRowInfo.instance == this;
  };
  FullWidthRowManagerBase.prototype.render = function (params) {
    throw new lib.Error('NOT_IMPLMENTED', 'render has to be implemented by '+this.constructor.name);
  };

  FullWidthRowManagerBase.prototype.fullWidthRowData = function (masterrowdata) {
    var ret = lib.extend(
      {},
      masterrowdata,
      {
        allexAgFullWidthRowInfo: {
          orig_data: masterrowdata,
          instance: null,
          handler: null
        }
      }
    );
    ret.allexAgFullWidthRowInfo.instance = this;
    return ret;
  };

  mylib.FullWidthRowManagerBase = FullWidthRowManagerBase;
}
module.exports = createFullWidthRowManagerBase;
},{}],3:[function(require,module,exports){
function createFullWidthRowManagers (execlib, applib, outerlib) {
  'use strict';

  var mylib = {};

  mylib.jobs = require('./jobs')(execlib, applib, outerlib);

  require('./basecreator')(execlib, applib, outerlib, mylib);
  require('./masterdetailcreator')(execlib, applib, outerlib, mylib);

  mylib.createFullWidthRowManagers = function (gridel, options) {
    var ret = [];
    if (options.detailRowCtor) {
      ret.push(new this.MasterDetailManager(gridel, options))
    }

    return ret.length>0 ? ret : null;
  };

  return mylib;
}
module.exports = createFullWidthRowManagers;
},{"./basecreator":2,"./jobs":6,"./masterdetailcreator":7}],4:[function(require,module,exports){
function createBaseFullWidthRowJob (execlib, applib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    JobOnDestroyableBase = qlib.JobOnDestroyableBase;
  
  function JobOnFullWidthRowManagerBase (manager, defer) {
    JobOnDestroyableBase.call(this, manager, defer);
  }
  lib.inherit(JobOnFullWidthRowManagerBase, JobOnDestroyableBase);
  JobOnFullWidthRowManagerBase.prototype._destroyableOk = function () {
    if (!this.destroyable) {
      throw new lib.Error('NO_MANAGER', 'No manager available');
    }
    if (!this.destroyable.gridEl){
      throw new lib.Error('NO_GRID_ELEMENT', 'Manager already destroyed, it has no gridEl');
    }
    return true;
  };
  JobOnFullWidthRowManagerBase.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok) {
      return ok.val;
    }
    this.goForSure();
    return ok.val;
  };

  mylib.Base = JobOnFullWidthRowManagerBase;
}
module.exports = createBaseFullWidthRowJob;
},{}],5:[function(require,module,exports){
function createDetailRowCreator (execlib, applib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib,
    Base = mylib.Base;
  
  function DetailRowCreatorJob (manager, params, descriptor, defer) {
    Base.call(this, manager, defer);
    this.params = params;
    this.descriptor = descriptor;
    this.attempts = 0;
  }
  lib.inherit(DetailRowCreatorJob, Base);
  DetailRowCreatorJob.prototype.destroy = function () {
    this.attempts = null;
    this.descriptor = null;
    this.params = null;
    Base.prototype.destroy.call(this);
  };
  DetailRowCreatorJob.prototype.goForSure = function () {
    this.goLater();
  };
  DetailRowCreatorJob.prototype.goLater = function () {
    lib.runNext(this.doFire.bind(this), 10);
  };
  DetailRowCreatorJob.prototype.doFire = function () {
    if (!this.okToProceed()) {
      return;
    }
    if (this.attempts>10) {
      this.reject(new lib.Error('DETAIL_ROW_CONTRUCTION_FAILED', 'Could not create DetailRow'));
      return;
    }
    this.attempts++;
    try {
      applib.BasicElement.createElement(this.descriptor, this.onDetailCtor.bind(this));
    } catch (e) {
      console.error(e);
      this.goLater();
    }
  };
  DetailRowCreatorJob.prototype.onDetailCtor = function (el) {
    if (!this.okToProceed()) {
      return;
    }
    try {
      this.destroyable.gridEl.addChild(el);
      this.params.data.allexAgFullWidthRowInfo.handler = el;
      el.set('agparams', this.params);
    }  catch (e) {
      console.error(e);
      this.goLater();
    }
  }

  mylib.DetailRowCreator = DetailRowCreatorJob;
}
module.exports = createDetailRowCreator;
},{}],6:[function(require,module,exports){
function createFullWidthRowJobs (execlib, applib, outerlib) {
  'use strict';

  var mylib = {};
  require('./basecreator')(execlib, applib, outerlib, mylib);
  require('./detailrowcreatorcreator')(execlib, applib, outerlib, mylib);
  return mylib;
}
module.exports = createFullWidthRowJobs;
},{"./basecreator":4,"./detailrowcreatorcreator":5}],7:[function(require,module,exports){
function createMasterDetailManager (execlib, applib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib,
    Base = mylib.FullWidthRowManagerBase,
    applib = execlib.execSuite.libRegistry.get('allex_applib'),
    BasicElement = applib.BasicElement,
    WebElement = applib.getElementType('WebElement');

  function DetailRowElement (id, options) {
    WebElement.call(this, id, options);
    this.agparams = null;
  }
  lib.inherit(DetailRowElement, WebElement);
  DetailRowElement.prototype.__cleanUp = function () {
    this.agparams = null;
    WebElement.prototype.__cleanUp.call(this);
  };
  DetailRowElement.prototype.setRowHeightAtOnce = function (height) {
    this.agparams.node.setRowHeight(height);
    this.__parent.doApi('onRowHeightChanged');
  };


  applib.registerElementType('DetailRow', DetailRowElement);

    
  function AllexDetailCellRenderer () {
    this.eGui = null;
    this.expandWaiter = null;
    this.myGui = null;
  }
  AllexDetailCellRenderer.prototype.destroy = function () {
    if (this.myGui && this.expandWaiter) {
      this.myGui.removeEventListener('click', this.expandWaiter);
    }
    this.myGui = null;
    this.expandWaiter = null;
    this.eGui = null;
  };
  AllexDetailCellRenderer.prototype.init = function (params) {
    var subcr, subgui, mygui;
    this.eGui = document.createElement('span');
    if (!params) {
      return;
    }
    if (params.colDef) {
      if (params.colDef.origCellRenderer) {
        subcr = params.colDef.origCellRenderer;
        if (subcr.prototype && subcr.prototype.init) {
          subcr = new subcr();
          subcr.init(params);
          subgui = subcr.getGui();
        } else {
          subgui = subcr(params);
        }
      }
      this.expandWaiter = params.colDef.expandWaiter.bind(null, params);
    }
    mygui = document.createElement('span');
    mygui.classList.add('ag-icon');
    mygui.classList.add('ag-icon-tree-closed');
    if (this.expandWaiter) {
      mygui.addEventListener('click', this.expandWaiter);
    }
    this.eGui.appendChild(mygui);
    if (subgui) {
      this.eGui.appendChild(subgui);
    } else {
      subgui = document.createElement('span');
      subgui.innerHTML = params.value;
    }
    this.eGui.appendChild(subgui);
  };
  AllexDetailCellRenderer.prototype.getGui = function () {
    return this.eGui;
  };

  function MasterDetailManager (gridel, options) {
    Base.call(this, gridel, options);
    if (!lib.isString(options.detailRowCtor)) {
      throw new lib.Error('NOT_A_STRING', 'detailRowCtor parameter has to be a String');
    }
    if (this.gridconf.columnDefs.length>0) {
      this.fixColumn0ForDetail();
    }
  }
  lib.inherit(MasterDetailManager, Base);
  MasterDetailManager.prototype.destroy = function () {
    Base.prototype.destroy.call(this);
  }
  MasterDetailManager.prototype.fixColumn0ForDetail = function () {
    var cellr = this.gridconf.columnDefs[0].cellRenderer;
    if (!cellr) {
      return;
    }
    if (lib.isString(cellr)) {
      if (!(this.gridconf.components && lib.isFunction(this.gridconf.components[cellr]))) {
        throw new lib.Error('Incorrect definition of cellRenderer', cellr);
      }
      cellr = this.gridconf.components[cellr];
    }
    if (!lib.isFunction(cellr)) {
      throw new lib.Error('Incorrect definition of cellRenderer', cellr);
    }
    this.gridconf.columnDefs[0].origCellRenderer = cellr;
    this.gridconf.columnDefs[0].cellRenderer = AllexDetailCellRenderer;
    this.gridconf.columnDefs[0].expandWaiter = this.expandRow.bind(this);
  };
  
  MasterDetailManager.prototype.expandRow = function (params, event) {
    var index, newdata, clicked;
    if (!this.gridEl) {
      return;
    }
    index = this.gridEl.indexOfObjectInData(params.data);
    if (index<0) {
      return;
    }
    clicked = event ? event.currentTarget : null;
    if (params.data.allexAgFullWidthRowExpanded) {
      if (clicked) {
        clicked.classList.remove('ag-icon-tree-open');
        clicked.classList.add('ag-icon-tree-closed');
      }
      newdata = this.gridEl.data[index+1];
      if (newdata.allexAgFullWidthRowInfo) {
        if (newdata.allexAgFullWidthRowInfo.handler) {
          newdata.allexAgFullWidthRowInfo.handler.destroy();
        }
        this.gridEl.data.splice(index+1, 1);
        this.gridEl.doApi('applyTransaction', {
          remove: [newdata]
        });
        newdata.allexAgFullWidthRowInfo.handler = null;
        newdata.allexAgFullWidthRowInfo.orig_data = null;
        newdata.allexAgFullWidthRowInfo.instance = null;
      }
      params.data.allexAgFullWidthRowExpanded = false;
      this.gridEl.masterRowCollapsing.fire(params.data);
      return;
    }
    if (clicked) {
      clicked.classList.remove('ag-icon-tree-closed');
      clicked.classList.add('ag-icon-tree-open');
    }
    newdata = this.fullWidthRowData(params.data);
    params.data.allexAgFullWidthRowExpanded = true;
    this.gridEl.data.splice(index+1, 0, newdata);
    this.gridEl.doApi('applyTransaction', {
      add: [newdata],
      addIndex: index+1
    });
    this.gridEl.masterRowExpanding.fire(params.data);
  };
  MasterDetailManager.prototype.render = function (params) {
    var gui = document.createElement('span'),
      cls = 'class_'+lib.uid(),
      desc;
    gui.classList.add(cls);
    gui.classList.add('allex-detail-row');
    gui.setAttribute('style', 'display:block; height:100%;');
    desc = {
      name: cls,
      type: this.options.detailRowCtor,
      options: {
        target_on_parent: '.'+cls,
        actual: true,
        agFullWidthRow: params.data.allexAgFullWidthRowInfo.orig_data
      }
    };
    (new mylib.jobs.DetailRowCreator(this, params, desc)).go();
    return gui;
  };

  mylib.MasterDetailManager = MasterDetailManager;
}
module.exports = createMasterDetailManager;
},{}],8:[function(require,module,exports){
function createGrid (execlib, applib, mylib) {
  'use strict';
  
  var lib = execlib.lib,
    fullWidthRowLib = require('./fullwidthrowmanagers')(execlib, applib, mylib),
    WebElement = applib.getElementType('WebElement');

  function AgGridElement (id, options) {
    this.fullWidthRowManagers = null;
    this.checkOptions(options);
    WebElement.call(this, id, options);
    this.data = null;
    this.selections = new lib.Map();
    this.rowSelected = this.createBufferableHookCollection();
    this.rowUnselected = this.createBufferableHookCollection();
    this.masterRowExpanding = this.createBufferableHookCollection();
    this.masterRowCollapsing = this.createBufferableHookCollection();
  }
  lib.inherit(AgGridElement, WebElement);
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
  AgGridElement.prototype.onAnySelection = function (typename, evntdata) {
    var selected = evntdata.node.selected, suffix = selected ? 'Selected' : 'Unselected';
    if (selected) {
      this.selections.replace(typename, evntdata.data);
    } else {
      if (this.selections.get(typename) != evntdata.data) {
        return;
      }
    }
    this[typename+suffix].fire(evntdata.data);
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

  AgGridElement.prototype.forEachRealColumnDef = function (cb) {
    this.forEachAnyForRealColumnDefs(this.get('columnDefs'), cb);
  };
  AgGridElement.prototype.forEachAnyForRealColumnDefs = function (arry, cb) {
    if (!lib.isArray(arry)) {
      return;
    };
    arry.forEach(this.doColumnDefInForEach.bind(this, cb));
    cb = null;
  };
  AgGridElement.prototype.doColumnDefInForEach = function (cb, coldef) {
    if (!coldef) {
      return;
    }
    if (lib.isArray(coldef.children)) {
      this.forEachAnyForRealColumnDefs(coldef.children, cb);
      return;
    }
    cb (coldef);
  };

  AgGridElement.prototype.reduceRealColumnDefs = function (cb, initvalue) {
    return this.reduceAnyForRealColumnDefs(this.get('columnDefs'), cb, initvalue);
  };
  AgGridElement.prototype.reduceAnyForRealColumnDefs = function (arry, cb, initvalue) {
    var ret;
    if (!lib.isArray(arry)) {
      return initvalue;
    };
    ret = arry.reduce(this.doColumnDefInReduce.bind(this, cb), initvalue);
    cb = null;
    return ret;
  };
  AgGridElement.prototype.doColumnDefInReduce = function (cb, res, coldef) {
    if (!coldef) {
      return res;
    }
    if (lib.isArray(coldef.children)) {
      return this.reduceAnyForRealColumnDefs(coldef.children, cb, res);
    }
    return cb (res, coldef);
  };

  AgGridElement.prototype.makeUpRunTimeConfiguration = function (obj) {
    obj.onRowSelected = this.onAnySelection.bind(this, 'row');
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
      throw new lib.Error('INVALID_COLUMN_OBJECT', 'column Object must have fields "field"');
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
    return lib.isString(obj.field);
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
    obj.onCellValueChanged = this.onCellValueChanger;
    AgGridElement.prototype.makeUpRunTimeConfiguration.call(this, obj);
  };
  EditableAgGridElement.prototype.onAgGridElementCreated = function () {
      //this.getConfigVal('aggrid').api.addEventListener('cellValueChanged', this.onCellValueChanger);
    AgGridElement.prototype.onAgGridElementCreated.call(this);
  };
  EditableAgGridElement.prototype.set_data = function (data) {
    this.purgeDataOriginals();
    return AgGridElement.prototype.set_data.call(this, data);
  }

  applib.registerElementType('EditableAgGrid', EditableAgGridElement);
}
module.exports = createGrid;

},{"./fullwidthrowmanagers":3}],9:[function(require,module,exports){
function createElements (execlib, mylib) {
  'use strict';

  var lR = execlib.execSuite.libRegistry,
    applib = lR.get('allex_applib');

  require('./gridcreator')(execlib, applib, mylib);
  require('./chartcreator')(execlib, applib, mylib);
}
module.exports = createElements;

},{"./chartcreator":1,"./gridcreator":8}],10:[function(require,module,exports){
function createFormatters (execlib, outerlib) {
  'use strict';

  var mylib = {};

  outerlib.registerFormatter = function (formattername, formatterfunc) {
    mylib[formattername] = formatterfunc;
  };

  require('./numbercreator')(execlib, mylib);
  outerlib.formatters = mylib;
}
module.exports = createFormatters;

},{"./numbercreator":11}],11:[function(require,module,exports){
function createNumberFormatters (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function numberToString (num, decimals) {
    var ret = num.toFixed(decimals);
    var eind = ret.indexOf('e');
    var mant, exp, mantfull;
    if (eind>0) {
      mant = ret.substring(0, eind);
      mantfull = mant.replace(/[^0-9]/g, '');
      exp = parseInt(ret.substr(eind+2));
      while (mantfull.length<exp+1) {
        mantfull = mantfull+'0';
      }
      ret = mantfull;
    }
    return ret;
  }

  function formatNumber (options, data) {
    var val = data.value, vals;
    options = options || {};
    if (!lib.isNumber(val)) {
      if (!options.force) {
        return val;
      }
      val = 0;
    }
    if (lib.isNumber(options.premultiplyby)) {
      val = options.premultiplyby*val;
    }
    if (lib.isNumber(options.decimals)) {
      val = numberToString(val, options.decimals);
    }
    if (lib.isString(options.separator)) {
      vals = val.split('.');
      vals[0] = vals[0].replace(/\B(?=(\d{3})+(?!\d))/g, options.separator);
      val = vals.join('.');
    }
    if (lib.isString(options.prefix)) {
      val = options.prefix+val;
    }
    if (lib.isString(options.suffix)) {
      val = val+options.suffix;
    }
    return val;
  }

  mylib.number = formatNumber;
}
module.exports = createNumberFormatters;

},{}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
function createGridMixins (execlib, outerlib) {
  'use strict';

  var mylib = {};

  require('./editablemixincreator')(execlib, outerlib, mylib);

  outerlib.gridmixins = mylib;
}
module.exports = createGridMixins;
},{"./editablemixincreator":12}],14:[function(require,module,exports){
(function (execlib) {
  'use strict';

  var mylib = {
    jobs: require('./jobs')(execlib),
    gridmixins: null
  };
  require('./gridmixins')(execlib, mylib);

  require('./formatters')(execlib, mylib);
  require('./parsers')(execlib, mylib);
  require('./elements')(execlib, mylib);

  execlib.execSuite.libRegistry.register('allex_aggridwebcomponent', mylib);
})(ALLEX);

},{"./elements":9,"./formatters":10,"./gridmixins":13,"./jobs":16,"./parsers":17}],15:[function(require,module,exports){
function createCellUpdaterJob (execlib, mylib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    JobOnDestroyable = qlib.JobOnDestroyable;

  var jobcount = 0;

  function CellUpdaterJob (grid, rownode, propname, value, defer) {
    jobcount++;
    JobOnDestroyable.call(this, grid, defer);
    this.rownode = rownode;
    this.propname = propname;
    this.value = value;
    this.updateListener = null;
  }
  lib.inherit(CellUpdaterJob, JobOnDestroyable);
  CellUpdaterJob.prototype.destroy = function () {
    if (this.updateListener) {
      this.updateListener.destroy();
    }
    this.updateListener = null;
    this.value = null;
    this.propname = null;
    this.rownode = null;
    JobOnDestroyable.prototype.destroy.call(this);
    jobcount--;
    //console.log(jobcount, 'left');
  };
  CellUpdaterJob.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok) {
      return ok.val;
    }
    if (this.rownode &&
      this.rownode.data &&
      this.rownode.data[this.propname] === this.value
    ) {
      lib.runNext(this.resolve.bind(this, true));
      return ok.val;
    }
    this.rownode.setDataValue(this.propname, this.value);
    this.updateListener = this.destroyable.cellEdited.attach(this.onCellEdited.bind(this));
    return ok.val;
  };

  CellUpdaterJob.prototype.onCellEdited = function (params) {
    if (!this.okToProceed()) {
      return;
    }
    if (!params) {
      return;
    }
    if (!this.rownode) {
      this.resolve(false);
    }
    if (
      this.rownode == params.node &&
      params.column &&
      params.column.colId == this.propname &&
      params.newValue == this.value
    ) {
      this.resolve(true);
    }
  };

  mylib.CellUpdater = CellUpdaterJob;
}
module.exports = createCellUpdaterJob;
},{}],16:[function(require,module,exports){
function createJobs (execlib) {
  'use strict';

  var mylib = {};

  require('./cellupdatercreator')(execlib, mylib);

  return mylib;
}
module.exports = createJobs;
},{"./cellupdatercreator":15}],17:[function(require,module,exports){
function createParsers (execlib, outerlib) {
  'use strict';

  var mylib = {};

  outerlib.registerParser = function (parsername, parserfunc) {
    mylib[parsername] = parserfunc;
  };

  require('./numbercreator')(execlib, mylib);
  outerlib.parsers = mylib;
}
module.exports = createParsers;

},{"./numbercreator":18}],18:[function(require,module,exports){
function createNumberParsers (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function parseNumberPhase2 (options, num) {
    if (!lib.isNumber(num)) {
      if (!options.force){
        return num;
      }
      num = 0;
    }
    options = options || {};
    if (options.premultiplyby) {
      num =  num/(options.premultiplyby); //premultiplyby is taken from formatter, so inverse here
    }
    return num;
  }

  function parseNumber (options, data) {
    var val = data.newValue;
    options = options || {};
    if (lib.isNumber(val)) {
      return parseNumberPhase2(options, val);
    }
    if (lib.isString(val)) {
      if (options.prefix) {
        val = val.replace(new RegExp('^'+options.prefix), '');
      }
      if (options.suffix) {
        val = val.replace(new RegExp(options.suffix+'$'), '');
      }
      if (options.separator) {
        val = val.replace(new RegExp(options.separator, 'g'), '');
      }
      val = parseFloat(val);
      if (!lib.isNumber(val)) {
        if (!options.force){
          return data.oldValue;
        }
        val = 0;
      }
      return parseNumberPhase2(options, val);
    }
    return data.oldValue;
  }

  mylib.number = parseNumber;
}
module.exports = createNumberParsers;

},{}]},{},[14]);
