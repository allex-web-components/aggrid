function createThemableMixin (execlib, outerlib, mylib) {
  'use strict';

  function ThemableMixin (options) {

  }
  ThemableMixin.prototype.destroy = function () {

  };
  ThemableMixin.prototype.staticEnvironmentDescriptor = function (myname) {
    var pathtotheming = this.getConfigVal('themingpath');
    if (!pathtotheming) {
      return;
    }
    return {
      logic: [{
        triggers: 'element.'+pathtotheming+':theme',
        handler: onTheme.bind(this)
      }]
    }
  };

  ThemableMixin.addMethods = function (klass) {

  };

  mylib.Themable = ThemableMixin;

  //statics
  function onTheme (theme) {
    var dark;
    if (!(this.$element && this.$element.length)) {
      return;
    }
    dark = theme=='dark';
    if (dark) {
      this.$element.removeClass('ag-theme-balham');
      this.$element.addClass('ag-theme-balham-dark');
      return;
    }
    this.$element.removeClass('ag-theme-balham-dark');
    this.$element.addClass('ag-theme-balham');
}
  //endof statics
}
module.exports = createThemableMixin;