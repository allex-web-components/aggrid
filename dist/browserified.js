(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function createAllexBaseEditor (execlib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib;
  var lR = execlib.execSuite.libRegistry;
  var applib = lR.get('allex_applib');

  function AllexBaseEditor () {
    this.initParams = null;
    this.containerCell = null;
    this.panel = null;
    this.resizeListener = this.onResize.bind(this);
    this.resizeObserver = null;
  }
  AllexBaseEditor.prototype.destroy = function () {
    optionallyChangeOtherFields.call(this);
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.containerCell);
    }
    this.resizeListener = null;
    if (this.panel) {
      this.panel.destroy();
    }
    this.panel = null;
    this.containerCell = null;
    this.initParams = null;
  };
  AllexBaseEditor.prototype.init = function (params) {
    var parentel, pname;
    this.initParams = params;
    pname = params.parentelementname;
    if (params.eGridCell) {
      this.containerCell = params.eGridCell;
      this.resizeObserver = new ResizeObserver(this.resizeListener);
      this.resizeObserver.observe(this.containerCell);
    }
    if (pname) {
      parentel = applib.App.getElement('element.'+pname);
      if (parentel) {
        this.panel = parentel.createElement(this.panelDescriptor(parentel));
      }
    }
  };
  AllexBaseEditor.prototype.getGui = function () {
    return this.panel ? this.panel.$element[0] : null;
  };
  AllexBaseEditor.prototype.getValue = function () {
    return this.panel ? this.editValueOfPanel() : null;
  };
  AllexBaseEditor.prototype.isCancelBeforeStart = function () {
    return !this.panel;
  };
  AllexBaseEditor.prototype.isCancelAfterEnd = function () {
    return !this.panel;
  };
  AllexBaseEditor.prototype.afterGuiAttached = function () {
    this.onResize();
  };

  AllexBaseEditor.prototype.onResize = function () {
    if (this.containerCell && this.panel && this.panel.$element) {
      var p = this.isPopup() ? this.panel.$element.parent() : this.panel.$element;
      p.width(this.containerCell.clientWidth);
      p.height(this.containerCell.clientHeight);
    }
  };
  AllexBaseEditor.prototype.editValueOfPanel = function () {
    return this.panel.get('value');
  };
  AllexBaseEditor.prototype.getOtherPropsAndValuesToChangeAfterSelfEdit = function () {
    return null;
  };

  AllexBaseEditor.prototype.panelDescriptor = function (parentel) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement panelDescriptor');
  };

  //statics
  function isPropAndVal (thingy) {
    return lib.isArray(thingy) && thingy.length==2 && lib.isNonEmptyString(thingy[0]);
  }
  function optionallyChangeOtherFields () {
    var psandvs = this.getOtherPropsAndValuesToChangeAfterSelfEdit();
    if (lib.isArrayOfHaving(psandvs, isPropAndVal)) {
      lib.runNext(dataValueSetterFromArry.bind(null, this.initParams.node, psandvs));
      psandvs = null;
    }
  }
  //endof statics

  function dataValueSetterFromArry (node, psandvals) {
    psandvals.forEach(dataValueSetter.bind(null, node));
    node = null;
  }
  function dataValueSetter (node, propandval) {
    node.setDataValue(propandval[0], propandval[1]);
    node = null;
    propandval = null;
  }

  mylib.AllexBase = AllexBaseEditor;
}
module.exports = createAllexBaseEditor;
},{}],2:[function(require,module,exports){
function createAllexUniqueEditor (execlib, lR, o, m, outerlib, mylib) {
  'use strict';

  var Base = mylib.AllexBase;
  var lib = execlib.lib;
  var applib = lR.get('allex_applib');

  var WebElement = applib.getElementType('WebElement');

  function createMarkup (options) {
    return o(m.div
      , 'CLASS', ''
      , 'ATTRS', 'inputholder_element="Input"'
    )
  }
  
  function EditorInputHolderElement (id, options) {
    options = options || {};
    options.default_markup = options.default_markup || createMarkup(options.markup);
    WebElement.call(this, id, options);
    this.value = null;
  }
  lib.inherit(EditorInputHolderElement, WebElement);
  EditorInputHolderElement.prototype.__cleanUp = function () {
    this.value = null;
    WebElement.prototype.__cleanUp.call(this);
  };
  EditorInputHolderElement.prototype.staticEnvironmentDescriptor = function (myname) {
    return {
      elements: [{
        type: inputType(this.getConfigVal('type')),
        name: myname+'.Input',
        options: {
          actual: true,
          self_select: 'attrib:inputholder_element',
          value: this.getConfigVal('value'),
          set_classes: ['w-100', 'h-100']
        }
      }]
    };
  };
  EditorInputHolderElement.prototype.actualEnvironmentDescriptor = function (myname) {
    return {
      links: [{
        source: 'element.'+myname+'.Input:value',
        target: 'element.'+myname+':value'
      }]
    };
  };
  EditorInputHolderElement.prototype.set_value = function (val) {
    if (val === this.value) {
      return false;
    }
    this.value = val;
    return true;
  };
  EditorInputHolderElement.prototype.get_value = function () {
    return this.value;
  };
  function inputType (type) {
    switch (type) {
      case 'Search':
      case 'search':
        return 'SearchInputElement';
      case 'Password':
      case 'password':
        return 'PasswordInputElement';
      case 'Number':
      case 'number':
        return 'NumberInputElement';
      case 'Email':
      case 'email':
        return 'EmailInputElement';
      case 'Phone':
      case 'phone':
        return 'PhoneInputElement';
      case 'Text':
      case 'text':
      default:
        return 'TextInputElement';
    }
  }

    
  applib.registerElementType('EditorInputHolder', EditorInputHolderElement);

  function AllexInputBaseEditor () {
    Base.call(this);
    this.classLevelValidations = this.getClassLevelValidations();
    this.valid = true;
  }
  lib.inherit(AllexInputBaseEditor, Base);
  AllexInputBaseEditor.prototype.destroy = function () {
    this.valid = null;
    this.classLevelValidations = null;
    Base.prototype.destroy.call(this);
  };
  AllexInputBaseEditor.prototype.panelDescriptor = function (parentel) {
    return {
      type: 'EditorInputHolder',
      name: 'EditorInputHolder',
      options: {
        actual: true,
        type: this.initParams.type,
        value: this.initParams.value
      }
    };
  };
  AllexInputBaseEditor.prototype.isPopup = function () {
    return false;
  };
  AllexInputBaseEditor.prototype.editValueOfPanel = function () {
    return this.panel.get('value');
  };
  AllexInputBaseEditor.prototype.afterGuiAttached = function () {
    this.panel.attachListener('changed', 'value', this.onValueChanged.bind(this));
    Base.prototype.afterGuiAttached.call(this);
  };
  AllexInputBaseEditor.prototype.isCancelAfterEnd = function () {
    return !this.valid;
  };
  AllexInputBaseEditor.prototype.onValueChanged = function (newval, oldval) {
    validationProc.call(this, this.initParams.validations, newval, oldval);
    if (!this.valid) {
      return;
    }
    validationProc.call(this, this.classLevelValidations, newval, oldval);
  };
  AllexInputBaseEditor.prototype.getClassLevelValidations = function () {
    return null;
  };
  //static
  function validationProc (arry, newval, oldval) {
    if (!lib.isArray(arry)) {
      return false;
    }
    arry.every(validation.bind(this, newval, oldval));
    newval = null;
    oldval = null;
  }
  //endof static
  function validation (newval, oldval, vld) {
    if (lib.isFunction(vld.invalid)) {
      if (vld.invalid(newval, oldval)) {
        if (vld.class) {
          this.panel.$element.addClass(vld.class);
        }
        this.valid = (vld.crucial==false) ? true : false;
        return false; //stop at first validator returning trueish
      }
      if (vld.class) {
        this.panel.$element.removeClass(vld.class);
      }
      this.valid = true;
      return true;
    }
    this.valid = true;
    return true;
  }

  mylib.AllexInputBase = AllexInputBaseEditor;
}
module.exports = createAllexUniqueEditor;
},{}],3:[function(require,module,exports){
function createAllexLookupEditor (execlib, lR, o, m, outerlib, mylib) {
  'use strict';

  var Base = mylib.AllexBase;
  var lib = execlib.lib;

  function AllexLookupEditor () {
    Base.call(this);
  }
  lib.inherit(AllexLookupEditor, Base);
  AllexLookupEditor.prototype.destroy = function () {
    Base.prototype.destroy.call(this);
  };
  AllexLookupEditor.prototype.panelDescriptor = function (parentel) {
    var options = lib.extend({
      actual: true,
      default_markup: o(m.textinput
        , 'CLASS', 'form-control form-select'
        ),
      value: this.initParams.value
    }, this.initParams.options);

    return {
      type: 'CustomSelect',
      name: 'LookupEditor',
      options: options
    }
  };
  AllexLookupEditor.prototype.isPopup = function () {
    return true;
  };

  mylib.AllexLookup = AllexLookupEditor;
}
module.exports = createAllexLookupEditor;
},{}],4:[function(require,module,exports){
function createAllexUniqueEditor (execlib, lR, o, m, outerlib, mylib) {
  'use strict';

  var Base = mylib.AllexInputBase;
  var lib = execlib.lib;
  var arryopslib = lR.get('allex_arrayoperationslib');

  function AllexUniqueEditor () {
    Base.call(this);
  }
  lib.inherit(AllexUniqueEditor, Base);
  AllexUniqueEditor.prototype.destroy = function () {
    Base.prototype.destroy.call(this);
  };
  AllexUniqueEditor.prototype.getClassLevelValidations = function () {
    return [{
      invalid: this.checkUniqueness.bind(this),
      class: 'invalid'
    }];
  };
  AllexUniqueEditor.prototype.checkUniqueness = function (val, oldval) {
    var pdata = this.panel.__parent.get('data') || [];
    var mypropname = this.initParams.colDef.field;
    var myrowindex = this.initParams.node.rowIndex;
    var ret = pdata.every(uniqueer.bind(null, mypropname, myrowindex, val));
    mypropname = null;
    myrowindex = null;
    val = null;
    return !ret;
  };
  function uniqueer (pname, rowindex, val, row, index) {
    if (rowindex == index) {
      return true;
    }
    return row[pname]!==val;
  }

  mylib.AllexUnique = AllexUniqueEditor;
}
module.exports = createAllexUniqueEditor;
},{}],5:[function(require,module,exports){
function createEditors (execlib, mylib) {
  'use strict';

  var lR = execlib.execSuite.libRegistry;
  var o = lR.get('allex_templateslitelib').override;
  var m = lR.get('allex_htmltemplateslib');

  var editors = {};

  require('./allexbaseeditorcreator')(execlib, mylib, editors);
  require('./allexinputbaseeditorcreator')(execlib, lR, o, m, mylib, editors);
  require('./allexuniqueeditorcreator')(execlib, lR, o, m, mylib, editors);
  require('./allexlookupeditorcreator')(execlib, lR, o, m, mylib, editors);

  mylib.editors = editors;
}
module.exports = createEditors;
},{"./allexbaseeditorcreator":1,"./allexinputbaseeditorcreator":2,"./allexlookupeditorcreator":3,"./allexuniqueeditorcreator":4}],6:[function(require,module,exports){
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
      },{
        data: []
      }, this.getConfigVal('agchart'));
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

},{}],7:[function(require,module,exports){
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

  FullWidthRowManagerBase.prototype.fullWidthRowData = function (masterrowparams) {
    var ret = lib.extend(
      {},
      masterrowparams.data,
      {
        allexAgFullWidthRowInfo: {
          orig_data: masterrowparams.data,
          instance: null,
          handler: null
        }
      }
    );
    ret.allexAgFullWidthRowInfo.instance = this;
    ret.allexAgFullWidthRowInfo.nodeIndex = masterrowparams.node.id;
    return ret;
  };

  mylib.FullWidthRowManagerBase = FullWidthRowManagerBase;
}
module.exports = createFullWidthRowManagerBase;
},{}],8:[function(require,module,exports){
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
},{"./basecreator":7,"./jobs":11,"./masterdetailcreator":12}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
function createFullWidthRowJobs (execlib, applib, outerlib) {
  'use strict';

  var mylib = {};
  require('./basecreator')(execlib, applib, outerlib, mylib);
  require('./detailrowcreatorcreator')(execlib, applib, outerlib, mylib);
  return mylib;
}
module.exports = createFullWidthRowJobs;
},{"./basecreator":9,"./detailrowcreatorcreator":10}],12:[function(require,module,exports){
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
  DetailRowElement.prototype.set_agparams = function (agprms) {
    this.agparams = agprms;
    return true;
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
        newdata.allexAgFullWidthRowInfo.nodeIndex = null;
      }
      params.data.allexAgFullWidthRowExpanded = false;
      this.gridEl.masterRowCollapsing.fire(params.data);
      return;
    }
    if (clicked) {
      clicked.classList.remove('ag-icon-tree-closed');
      clicked.classList.add('ag-icon-tree-open');
    }
    newdata = this.fullWidthRowData(params);
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
      options: lib.extend({}, this.options.detailRowCtorOptions, {
        target_on_parent: '.'+cls,
        actual: true
      })
    };
    (new mylib.jobs.DetailRowCreator(this, params, desc)).go();
    return gui;
  };

  mylib.MasterDetailManager = MasterDetailManager;
}
module.exports = createMasterDetailManager;
},{}],13:[function(require,module,exports){
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

},{"./fullwidthrowmanagers":8}],14:[function(require,module,exports){
function createElements (execlib, mylib) {
  'use strict';

  var lR = execlib.execSuite.libRegistry,
    applib = lR.get('allex_applib');

  require('./gridcreator')(execlib, applib, mylib);
  require('./chartcreator')(execlib, applib, mylib);
}
module.exports = createElements;

},{"./chartcreator":6,"./gridcreator":13}],15:[function(require,module,exports){
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

},{"./numbercreator":16}],16:[function(require,module,exports){
function createNumberFormatters (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function numberToString (num, decimals) {
    var ret = num.toFixed(decimals);
    var eind = ret.indexOf('e');
    var mant, exp, mantfull;
    if (eind>0) {
      mant = ret.substring(0, eind);
      mantfull = mant.replace(/[^-0-9]/g, '');
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

},{}],17:[function(require,module,exports){
function createContextMenuableMixin (execlib, outerlib, mylib) {
  'use strict';
  var lib = execlib.lib;

  function MenuHolder (options) {
    options = options || {};
    options.item = options.item || {};
    this.uid = lib.uid();
    this.menu = jQuery('<ul>');
    this.menu.attr({id: this.uid});
    this.menu.css({position:'absolute'});
    this.menu.hide();
    if (options.class) {
      this.menu.addClass(options.class);
    }
    this.clicker = this.onClick.bind(this);
    this.chooser = this.itemChooser.bind(this);
    this.items = null;
    this.itemClass = options.item.class || '';
    jQuery('body').append(this.menu);
    jQuery(document).on('click', this.clicker);
  }
  MenuHolder.prototype.destroy = function () {
    this.itemClass = null;
    this.items = null;
    this.chooser = null;
    if (this.clicker) {
      jQuery(document).off('click', this.clicker);
    }
    this.clicker = null;
    if (this.menu) {
      jQuery('body').remove(this.menu);
    }
    this.menu = null;
    this.uid = null;
  };
  MenuHolder.prototype.addItems = function (items) {
    if (!this.menu) {
      return;
    }
    this.items = null;
    this.menu.find('li').off('click', this.clicker);
    this.menu.empty();
    if (!lib.isArray(items)) {
      return;
    }
    this.items = items;
    items.forEach(this.addItem.bind(this));
  };
  MenuHolder.prototype.showFromEvent = function (evnt) {
    this.menu.css({
      left: evnt.pageX+'px',
      top: evnt.pageY+'px'
    });
    this.menu.show();
    evnt.preventDefault();
    evnt.stopPropagation();
  };
  MenuHolder.prototype.addItem = function (item, index) {
    var li = this.item2Li(item, index);
    if (li && li[0]) {
      this.menu.append(li);
    }
  };
  MenuHolder.prototype.onClick = function (evnt) {
    if (!this.menu.is(':visible')) {
      return;
    }
    if (!(evnt && evnt.target)) {
      return;
    }
    if (jQuery(evnt.target).parents('#'+this.uid).length<1) {
      this.menu.hide();
      return;
    }
  };
  MenuHolder.prototype.item2Li = function (item, index) {
    var ret = jQuery('<li>');
    ret.addClass(this.itemClass);
    ret.attr('itemindex', index+'');
    if (!item) {
      ret.addClass('separator');
      return ret;
    }
    if (item.caption) {
      ret.text(item.caption);
    }
    ret.on('click', this.chooser);
    return ret;
  };
  MenuHolder.prototype.itemChooser = function (evnt) {
    var li, index, item;
    this.menu.hide();
    if (!(evnt && evnt.target)){
      return;
    }
    if (!lib.isArray(this.items)) {
      return;
    }
    li = jQuery(evnt.target);
    index = parseInt(li.attr('itemindex'));
    if (isNaN(index)) {
      return;
    }
    if (index < 0 || index >= this.items.length) {
      return;
    }
    item = this.items[index];
    if (lib.isFunction(item.action)) {
      item.action();
    }
  };

  function ContextMenuableAgGridMixin (options) {
    this.ctxMenuDescriptor = (options && options.contextmenu) ? options.contextmenu.items : null;
    this.globalCtxMenuDescriptor = (options && options.globalcontextmenu) ? options.globalcontextmenu.items : null;
    this.holder = (options && options.contextmenu) ? new MenuHolder(options.contextmenu) : null;
    this.globalHolder = (options && options.globalcontextmenu) ? new MenuHolder(options.globalcontextmenu) : null;
    this.onContextMenuer = this.onContextMenu.bind(this);
  }
  ContextMenuableAgGridMixin.prototype.destroy = function () {
    this.onContextMenuer = null;
    if (this.holder) {
      this.holder.destroy();
    }
    this.holder = null;
    if (this.$element) {
      this.$element.off('contextmenu', this.onContextMenuer);
    }
    this.ctxMenuDescriptor = null;
  };
  ContextMenuableAgGridMixin.prototype.listenForContextMenu = function () {
    this.$element.on('contextmenu', this.onContextMenuer);
  };
  ContextMenuableAgGridMixin.prototype.onContextMenu = function (evnt) {
    var ctxmenudesc;
    if (!(this.ctxMenuDescriptor || this.globalCtxMenuDescriptor)) {
      return;
    }
    if (!(evnt && evnt.target && evnt.target.__agComponent)) {
      ctxmenudesc = lib.isFunction(this.globalCtxMenuDescriptor) ? this.globalCtxMenuDescriptor() : this.globalCtxMenuDescriptor;
      if (!ctxmenudesc) {
        return;
      }
      this.globalHolder.addItems(ctxmenudesc);
      this.globalHolder.showFromEvent(evnt);
      return;
    }
    //console.log(evnt.target.__agComponent);
    ctxmenudesc = lib.isFunction(this.ctxMenuDescriptor) ? this.ctxMenuDescriptor(evnt.target.__agComponent) : this.ctxMenuDescriptor;
    if (!ctxmenudesc) {
      return;
    }
    this.holder.addItems(ctxmenudesc);
    this.holder.showFromEvent(evnt);
  };

  ContextMenuableAgGridMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, ContextMenuableAgGridMixin
      ,'listenForContextMenu'
      ,'onContextMenu'
      ,'purgeContextMenu'
    );
  }

  mylib.ContextMenuable = ContextMenuableAgGridMixin;
}
module.exports = createContextMenuableMixin;
},{}],18:[function(require,module,exports){
function addCellValueHandling (execlib, outerlib, mylib) {
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
    var cntobj = {cnt: 0}, ret;
    this.traverse(cellcounter.bind(null, cntobj));
    ret = cntobj.cnt;
    cntobj = null;
    return ret;
  };
  function cellcounter (cntobj, cells, rowindex) {
    cntobj.cnt += cells.length;
  };

  var ChangedKeyPrefix = 'allexAgGrid_',
    ChangedKeySuffix = '_changed',
    EditableEditedCountPropName = ChangedKeyPrefix+'editableEditedCount';

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
    this.dataOriginals = null;
    this.changedEditableCells = null;
    this.changedNonEditableCells = null;
    this.changedCellCount = 0;
    this.editedCellCount = 0;
    this.editedRowsCount = 0;
    this.addedRowCount = 0;
    this.changedByUser = false;
    this.inBatchEdit = false;
    this.batchEditEvents = null;
    this.internalChange = false;
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
    this.internalChange = null;
    this.batchEditEvents = null;
    this.inBatchEdit = null;
    this.changedByUser = null;
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
    this.changeablepropnames = this.editablepropnames.slice();
    this.trackablepropnames.forEach(checkTrackableInColDefs.bind(null, coldefs));
    lib.arryOperations.appendNonExistingItems(this.changeablepropnames, this.trackablepropnames);
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
      throw new lib.Error('TRACKABLW_NAME_NOT_A_COLDEF_NAME', 'Trackable name '+trackablename+' is not a name of any columnDef');
    }
  }


  
  EditableAgGridMixin.prototype.onCellValueChanged = function (params) {
    var rec, fieldname, editableedited, changed, changedcountdelta, newrow;
    params.inBatchEdit = this.inBatchEdit;
    if (params.newValue === params.oldValue) {
      this.cellEdited.fire(params);
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
    if (!rec) {
      rec = lib.extendShallow({}, params.data);
      rec[fieldname] = params.oldValue;
      this.dataOriginals.add(params.rowIndex, rec);
    }
    changed = params.data[fieldname]!==rec[fieldname];
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
    if (outerlib.utils.blankRow.isEditFinished(params.data, this.getConfigVal('blankRow'))) {
      newrow = outerlib.utils.blankRow.toRegular(params.data);
      this.internalChange = true;
      this.set('data', [newrow].concat(this.get('data'))); //loud, with 'data' listeners being triggered
      this.internalChange = false;
      this.set('addedRowCount', this.get('addedRowCount')+1);
      this.newRowAdded.fire(newrow);
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
      return;
    }
    this.set('editedCellCount', this.changedEditableCells.cellCount());
    this.set('changedCellCount', this.get('editedCellCount') + this.changedNonEditableCells.cellCount());
    this.set('editedRowsCount', this.dataOriginals.count);
    setChangedByUser.call(this);
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
    }
    this.batchEditEvents = null;
    this.doApi('refreshCells');
  };

  EditableAgGridMixin.prototype.purgeDataOriginals = function () {
    if (this.internalChange) {
      return;
    }
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
  };

  EditableAgGridMixin.prototype.revertAllEdits = function () {
    var data;
    if (this.internalChange) {
      return;
    }
    if (!this.dataOriginals) {
      return;
    }
    if (lib.isArray(this.get('data'))) {
      data = this.get('data').slice();
      this.dataOriginals.traverse(function (val, recindex) {
        data[recindex] = val;
      });
      this.internalChange = true;
      this.set('data', data);
      this.internalChange = false;
      this.purgeDataOriginals();
      this.set('changedCellCount', 0);
      this.set('editedCellCount', 0);
      this.set('addedRowCount', 0);
      this.set('changedByUser', false);
      data = null;
      return;
    }
    this.purgeDataOriginals();
  };
  function editundoer (rec, originalrec) {
    var prop;
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
  };

  //statics
  function setChangedByUser () {
    this.set('changedByUser', 
      this.get('editedCellCount')!=0
      || this.get('changedCellCount')!=0
      || this.get('addedRowCount')!=0
    );
  }
  //endof statics

  EditableAgGridMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, EditableAgGridMixin
      , 'onCellValueChanged'
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
    if (lib.isVal(val)) {
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
},{}],19:[function(require,module,exports){
function createGridMixins (execlib, outerlib) {
  'use strict';

  var mylib = {};

  require('./editablemixincreator')(execlib, outerlib, mylib);
  require('./contextmenuablemixincreator')(execlib, outerlib, mylib);

  outerlib.gridmixins = mylib;
}
module.exports = createGridMixins;
},{"./contextmenuablemixincreator":17,"./editablemixincreator":18}],20:[function(require,module,exports){
(function (execlib) {
  'use strict';

  var mylib = {
    utils: require('./utils')(execlib.lib),
    jobs: require('./jobs')(execlib),
    gridmixins: null
  };
  require('./gridmixins')(execlib, mylib);

  require('./formatters')(execlib, mylib);
  require('./editors')(execlib, mylib);
  require('./parsers')(execlib, mylib);
  require('./elements')(execlib, mylib);

  execlib.execSuite.libRegistry.register('allex_aggridwebcomponent', mylib);
})(ALLEX);

},{"./editors":5,"./elements":14,"./formatters":15,"./gridmixins":19,"./jobs":22,"./parsers":23,"./utils":27}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
function createJobs (execlib) {
  'use strict';

  var mylib = {};

  require('./cellupdatercreator')(execlib, mylib);

  return mylib;
}
module.exports = createJobs;
},{"./cellupdatercreator":21}],23:[function(require,module,exports){
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

},{"./numbercreator":24}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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
},{}],26:[function(require,module,exports){
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
      coldef = lib.extend({}, lib.pickExcept(coldefs[i], [
        'valueGetter',
        'valueFormatter',
        'keyCreator',
        'cellEditor',
        'cellEditorParams'
      ]));
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
},{}],27:[function(require,module,exports){
function createUtils (lib) {
  'use strict';

  var mylib = {};
  require('./columndefutilscreator')(lib, mylib);
  require('./blankrowfunctionalitycreator')(lib, mylib);

  return mylib;
}
module.exports = createUtils;
},{"./blankrowfunctionalitycreator":25,"./columndefutilscreator":26}]},{},[20]);
