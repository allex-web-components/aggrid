function createAllexLookupEditor (execlib, lR, o, m, outerlib, mylib) {
  'use strict';

  var Base = mylib.AllexBase;
  var lib = execlib.lib;
  var _id = 0;

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
      value: this.initParams.value,
      focusonnewoptions: true
    }, this.initParams.options);

    return {
      type: 'CustomSelect',
      name: 'LookupEditor'+(++_id),
      options: options
    }
  };
  AllexLookupEditor.prototype.isPopup = function () {
    return true;
  };
  AllexLookupEditor.prototype.onPanelInitiallyLoaded = function (panel) {
    Base.prototype.onPanelInitiallyLoaded.call(this, panel);
    var el = panel.$element;
    if (!el) {
      return;
    }
    lib.runNext(el.trigger.bind(el, 'focus'));
    el = null;
  };

  mylib.AllexLookup = AllexLookupEditor;
}
module.exports = createAllexLookupEditor;