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
      var p = this.panel.$element.parent();
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