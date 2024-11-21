function createContextMenuableMixin (execlib, outerlib, mylib) {
  'use strict';
  var lib = execlib.lib;

  function MenuHolder (options) {
    options = options || {};
    options.item = options.item || {};
    this.uid = lib.uid();
    this.menu = jQuery('<ul>');
    this.menu.attr({id: this.uid});
    this.menu.css({position:'absolute'});
    this.menu.hide();
    if (options.class) {
      this.menu.addClass(options.class);
    }
    this.clicker = this.onClick.bind(this);
    this.chooser = this.itemChooser.bind(this);
    this.items = null;
    this.agComponent = null;
    this.itemClass = options.item.class || '';
    jQuery('body').append(this.menu);
    jQuery(document).on('click', this.clicker);
  }
  MenuHolder.prototype.destroy = function () {
    this.itemClass = null;
    this.agComponent = null;
    this.items = null;
    this.chooser = null;
    if (this.clicker) {
      jQuery(document).off('click', this.clicker);
    }
    this.clicker = null;
    if (this.menu) {
      jQuery('body').remove(this.menu);
    }
    this.menu = null;
    this.uid = null;
  };
  MenuHolder.prototype.isVisible = function(){
    return this.menu?.is(':visible');
  };
  MenuHolder.prototype.addItems = function (items, agComponent) {
    if (!this.menu) {
      return;
    }
    this.items = null;
    this.agComponent = null;
    this.menu.find('li').off('click', this.clicker);
    this.menu.empty();
    if (!lib.isArray(items)) {
      return;
    }
    this.items = items;
    this.agComponent = agComponent;
    items.forEach(this.addItem.bind(this));
  };
  MenuHolder.prototype.showFromEvent = function (evnt) {
    this.menu.css({
      left: evnt.pageX+'px',
      top: evnt.pageY+'px',
      'z-index': 5000
    });
    this.menu.show();
    evnt.preventDefault();
    evnt.stopPropagation();
  };
  MenuHolder.prototype.addItem = function (item, index) {
    var li = this.item2Li(item, index);
    if (li && li[0]) {
      this.menu.append(li);
    }
  };
  MenuHolder.prototype.onClick = function (evnt) {
    if (!this.menu.is(':visible')) {
      return;
    }
    if (!(evnt && evnt.target)) {
      return;
    }
    if (jQuery(evnt.target).parents('#'+this.uid).length<1) {
      this.menu.hide();
      return;
    }
  };
  MenuHolder.prototype.item2Li = function (item, index) {
    var ret = jQuery('<li>');
    ret.addClass(this.itemClass);
    ret.attr('itemindex', index+'');
    if (!item) {
      ret.addClass('separator');
      return ret;
    }
    if (item.caption) {
      ret.text(item.caption);
    }
    if (!lib.isFunction(item.action)) {
      ret.addClass('disabled');
    }
    ret.on('click', this.chooser);
    return ret;
  };
  MenuHolder.prototype.itemChooser = function (evnt) {
    var li, index, item;
    this.menu.hide();
    if (!(evnt && evnt.target)){
      return;
    }
    if (!lib.isArray(this.items)) {
      return;
    }
    li = jQuery(evnt.target);
    index = parseInt(li.attr('itemindex'));
    if (isNaN(index)) {
      return;
    }
    if (index < 0 || index >= this.items.length) {
      return;
    }
    item = this.items[index];
    if (lib.isFunction(item.action)) {
      lib.runNext(itemActioner.bind(null, item));
      //lib.runNext(item.action.bind(item));
    }
    item = null;
  };

  function itemActioner (item) {
    try {
      item.action();
    } catch (e) {
      console.error('Error in running AgGrid ContextMenu action', e);
    }
  }

  function ContextMenuableAgGridMixin (options) {
    this.ctxMenuDescriptor = (options && options.contextmenu) ? options.contextmenu.items : null;
    this.globalCtxMenuDescriptor = (options && options.globalcontextmenu) ? options.globalcontextmenu.items : null;
    this.holder = (options && options.contextmenu) ? new MenuHolder(options.contextmenu) : null;
    this.globalHolder = (options && options.globalcontextmenu) ? new MenuHolder(options.globalcontextmenu) : null;
    this.onContextMenuer = this.onContextMenu.bind(this);
  }
  ContextMenuableAgGridMixin.prototype.destroy = function () {
    this.onContextMenuer = null;
    if (this.holder) {
      this.holder.menu.remove();
      this.holder.destroy();
    }
    this.holder = null;
    if (this.$element) {
      this.$element.off('contextmenu', this.onContextMenuer);
    }
    this.ctxMenuDescriptor = null;
  };
  ContextMenuableAgGridMixin.prototype.listenForContextMenu = function () {
    this.$element.on('contextmenu', this.onContextMenuer);
  };
  ContextMenuableAgGridMixin.prototype.onContextMenu = function (evnt) {
    var ctxmenudesc, agComponent;
    if (!(this.ctxMenuDescriptor || this.globalCtxMenuDescriptor)) {
      return;
    }
    if (!(evnt && evnt.target && evnt.target.__agComponent)) {
      ctxmenudesc = lib.isFunction(this.globalCtxMenuDescriptor) ? this.globalCtxMenuDescriptor() : this.globalCtxMenuDescriptor;
      if (!ctxmenudesc) {
        return;
      }
      this.globalHolder.addItems(ctxmenudesc);
      this.globalHolder.showFromEvent(evnt);
      return;
    }
    //console.log(evnt.target.__agComponent);
    agComponent = evnt.target.__agComponent;
    ctxmenudesc = lib.isFunction(this.ctxMenuDescriptor) ? this.ctxMenuDescriptor(evnt.target.__agComponent) : this.ctxMenuDescriptor;
    if (!ctxmenudesc) {
      return;
    }
    this.holder.addItems(ctxmenudesc, agComponent);
    this.holder.showFromEvent(evnt);
  };

  ContextMenuableAgGridMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, ContextMenuableAgGridMixin
      ,'listenForContextMenu'
      ,'onContextMenu'
      ,'purgeContextMenu'
    );
  }

  mylib.ContextMenuable = ContextMenuableAgGridMixin;
}
module.exports = createContextMenuableMixin;