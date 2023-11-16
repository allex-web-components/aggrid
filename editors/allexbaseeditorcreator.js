function createAllexBaseEditor (execlib, outerlib, mylib) {
  'use strict';

  var lib = execlib.lib;
  var lR = execlib.execSuite.libRegistry;
  var applib = lR.get('allex_applib');

  function AllexBaseEditor () {
    this.initParams = null;
    this.containerCell = null;
    this.panelLoaded = null;
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
      if (this.panelLoaded) {
        this.panel.destroy();
      }
    }
    this.panel = null;
    this.panelLoaded = null;
    this.containerCell = null;
    this.initParams = null;
  };
  AllexBaseEditor.prototype.init = function (params) {
    var parentel, pname, paneldesc;    
    this.initParams = params;
    pname = params.parentelementname;
    this.panelLoaded = false;
    if (params.eGridCell) {
      this.containerCell = params.eGridCell;
      this.resizeObserver = new ResizeObserver(this.resizeListener);
      this.resizeObserver.observe(this.containerCell);
    }
    if (pname) {
      parentel = applib.App.getElement('element.'+pname);
      if (parentel) {
        paneldesc = this.panelDescriptor(parentel);
        paneldesc.options = paneldesc.options || {};
        paneldesc.options.onInitiallyLoaded = paneldesc.options.onInitiallyLoaded || [];
        paneldesc.options.onInitiallyLoaded.push(this.onPanelInitiallyLoaded.bind(this));
        this.panel = parentel.createElement(paneldesc);
      }
    }
  };
  AllexBaseEditor.prototype.getGui = function () {
    return (this.panel && this.panel.$element && this.panel.$element.length>0) ? this.panel.$element[0] : null;
  };
  AllexBaseEditor.prototype.getValue = function () {
    return this.panelLoaded ? this.editValueOfPanel() : this.initParams.value;
  };
  AllexBaseEditor.prototype.isCancelBeforeStart = function () {
    return !this.panel;
  };
  AllexBaseEditor.prototype.isCancelAfterEnd = function () {
    return !this.panel;
  };
  AllexBaseEditor.prototype.afterGuiAttached = function () {
    this.onResize();
    if (this.isPopup()) {
      this.panel.$element.parent().attr('tabIndex', -1);
    }
  };
  AllexBaseEditor.prototype.matchesRowAndColumnNames = function (row, colnames) {
    return this.initParams && this.initParams.rowIndex == row && colnames.indexOf(this.initParams.column.colId)>=0;
  };

  AllexBaseEditor.prototype.onResize = function () {
    var p;
    if (this.containerCell && this.panel && this.panel.$element) {
      p = this.isPopup() ? this.panel.$element.parent() : this.panel.$element;
      p.width(this.containerCell.clientWidth);
      p.height(this.containerCell.clientHeight);
    }
  };
  AllexBaseEditor.prototype.editValueOfPanel = function () {
    return this.panel.get('value');
  };
  AllexBaseEditor.prototype.setEditValueFromRecord = function (rec) {
    return this.panel.set('value', rec[this.initParams.column.colId]);
  };
  AllexBaseEditor.prototype.getOtherPropsAndValuesToChangeAfterSelfEdit = function () {
    return null;
  };

  AllexBaseEditor.prototype.panelDescriptor = function (parentel) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' has to implement panelDescriptor');
  };
  AllexBaseEditor.prototype.onPanelInitiallyLoaded = function (panel) {
    if (this.panelLoaded==null) {
      //I'm destroyed, so destroy panel as well
      panel.destroy();
      return;
    }
    this.panelLoaded = true;
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