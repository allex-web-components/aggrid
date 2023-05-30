function createEditors (execlib, mylib) {
  'use strict';

  var lR = execlib.execSuite.libRegistry;
  var o = lR.get('allex_templateslitelib').override;
  var m = lR.get('allex_htmltemplateslib');

  var editors = {};

  require('./allexbaseeditorcreator')(execlib, mylib, editors);
  require('./allexinputbaseeditorcreator')(execlib, lR, o, m, mylib, editors);
  require('./allexuniqueeditorcreator')(execlib, lR, o, m, mylib, editors);
  require('./allexlookupeditorcreator')(execlib, lR, o, m, mylib, editors);

  mylib.editors = editors;
}
module.exports = createEditors;