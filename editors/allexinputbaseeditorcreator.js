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
    this.valid = true;
  }
  lib.inherit(AllexInputBaseEditor, Base);
  AllexInputBaseEditor.prototype.destroy = function () {
    this.valid = null;
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
  AllexInputBaseEditor.prototype.onValueChanged = function (newval, oldval) {
    if (!lib.isArray(this.initParams.validations)) {
      return;
    }
    this.initParams.validations.every(validation.bind(this, newval, oldval));
    newval = null;
    oldval = null;
  };
  AllexInputBaseEditor.prototype.isCancelAfterEnd = function () {
    return !this.valid;
  };
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