function createAllexUniqueEditor (execlib, lR, o, m, outerlib, mylib) {
  'use strict';

  var Base = mylib.AllexBase;
  var lib = execlib.lib;
  var applib = lR.get('allex_applib');
  var _MAXFOCUSATTEMPTS = 5;

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
    this.focusAttempts = 0;
  }
  lib.inherit(AllexInputBaseEditor, Base);
  AllexInputBaseEditor.prototype.destroy = function () {
    this.focusAttempts = null;
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
  AllexInputBaseEditor.prototype.afterGuiAttached = function () {
    this.panel.attachListener('changed', 'value', this.onValueChanged.bind(this));
    Base.prototype.afterGuiAttached.call(this);
  };
  AllexInputBaseEditor.prototype.isCancelAfterEnd = function () {
    return !this.valid;
  };
  AllexInputBaseEditor.prototype.onPanelInitiallyLoaded = function (panel) {
    Base.prototype.onPanelInitiallyLoaded.call(this, panel);
    try {
      var el = panel.$element ? panel.$element.find('input').filter(':visible:first') : null;
      if (!(el && el.length>0)) {
        if (this.focusAttempts<_MAXFOCUSATTEMPTS) {
          this.focusAttempts++;
          lib.runNext(this.onPanelInitiallyLoaded.bind(this, panel), 100);
          panel = null;
        }
        return;
      }
      this.focusAttempts=0;
      lib.runNext(el.trigger.bind(el, 'focus'));
      el = null;
    }catch(e){
      console.error(e);
    }
  };
  AllexInputBaseEditor.prototype.onValueChanged = function (newval, oldval) {
    if (!this.initParams) {
      return;
    }
    this.valid = true;
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