function createEditors (execlib, mylib) {
  'use strict';

  var editors = {};

  require('./allexbaseeditorcreator')(execlib, mylib, editors);
  require('./allexlookupeditorcreator')(execlib, mylib, editors);

  mylib.editors = editors;
}
module.exports = createEditors;