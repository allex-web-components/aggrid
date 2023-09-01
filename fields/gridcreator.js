function createGridFields (execlib, lR, mylib) {
  'use strict';

  var lib = execlib.lib,
    applib = lR.get('allex_applib'),
    formlib = lR.get('allex_formwebcomponent'),
    EditableAgGridElement = applib.getElementType('EditableAgGrid'),
    FieldBaseMixin = formlib.mixins.FieldBase;

  function EditableAgGridFieldElement (id, options) {
    EditableAgGridElement.call(this, id, options);
    FieldBaseMixin.call(this, options);
    this.valid = null;
  }
  lib.inherit(EditableAgGridFieldElement, EditableAgGridElement);
  FieldBaseMixin.addMethods(EditableAgGridFieldElement); //now EditableAgGrid's set_data is stomped over
  EditableAgGridFieldElement.prototype.__cleanUp = function () {
    this.valid = null;
    FieldBaseMixin.prototype.destroy.call(this);
    EditableAgGridElement.prototype.__cleanUp.call(this);
  };
  EditableAgGridFieldElement.prototype.set_data = function (data) { //redefine it even further
    var ret = FieldBaseMixin.prototype.set_data.call(this, data);
    this.doPropertyFromHash(data, 'rows');
    return ret;
  };
  /*
  EditableAgGridFieldElement.prototype.get_data = function () {
    return EditableAgGridElement.prototype.get_data.call(this);
  };
  */
  EditableAgGridFieldElement.prototype.set_rows = function (rows) {
    return EditableAgGridElement.prototype.set_data.call(this, rows);
  };
  EditableAgGridFieldElement.prototype.get_value = function () {
    return this.data;
  }
  EditableAgGridFieldElement.prototype.isValueValid = function (val) {
    return true;
  };
  EditableAgGridFieldElement.prototype.resetData = function () {
    this.set('data', []);
  };

  applib.registerElementType('EditableAgGridField', EditableAgGridFieldElement);
}
module.exports = createGridFields;