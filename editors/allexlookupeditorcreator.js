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

  AllexLookupEditor.prototype.editValueOfPanel = function () {
    return this.panel.get('value');
  };

  mylib.AllexLookup = AllexLookupEditor;
}
module.exports = createAllexLookupEditor;