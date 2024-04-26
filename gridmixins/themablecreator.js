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

  //data
  var _possibleClasses = [
    'ag-theme-balham',
    'ag-default',
    'ag-sheets',
    'ag-polychroma',
    'ag-vivid',
    'ag-material'
  ];
  var _possibleClassesDark = _possibleClasses.map(function (klass) {return klass+'-dark';});
  //endof data

  //statics
  function onTheme (theme) {
    var dark, themeindex;
    if (!(this.$element && this.$element.length)) {
      return;
    }
    dark = theme=='dark';
    themeindex = baseThemeIndex.call(this, dark);
    if (themeindex<0) {
      return;
    }
    if (dark) {
      this.respondToThemeChange(_possibleClasses[themeindex], _possibleClassesDark[themeindex]);
      return;
    }
    this.respondToThemeChange(_possibleClassesDark[themeindex], _possibleClasses[themeindex]);
  }
  function baseThemeIndex (dark) {
    var clss, ind;
    if (!(this.$element && this.$element.length>0)) {
      return -1;
    }
    clss = (dark ? _possibleClasses : _possibleClassesDark); //the inverse of current class settings
    for (const cls of this.$element[0].classList.values()) {
      ind = clss.indexOf(cls);
      if (ind>=0) {
        return ind;
      }
    }
    return -1;
  }
  //endof statics
}
module.exports = createThemableMixin;