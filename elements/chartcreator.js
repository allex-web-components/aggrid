function createChart (execlib, applib, mylib) {
  'use strict';

  var lib = execlib.lib,
    WebElement = applib.getElementType('WebElement');

  function AgChartElement (id, options) {
    WebElement.call(this, id, options);
    mylib.gridmixins.Themable.call(this, options);
    this.data = null;
    this.chartOpts = null;
    this.chart = null;
  }
  lib.inherit(AgChartElement, WebElement);
  mylib.gridmixins.Themable.addMethods(AgChartElement);
  AgChartElement.prototype.__cleanUp = function () {
    this.chartOpts = null;
    this.data = null;
    mylib.gridmixins.Themable.prototype.destroy.call(this);
    WebElement.prototype.__cleanUp.call(this);
  };
  AgChartElement.prototype.doThejQueryCreation = function () {
    WebElement.prototype.doThejQueryCreation.call(this);
    if (this.$element && this.$element.length) {
      this.chartOpts = lib.extend({
        container: this.$element[0],
      },{
        data: []
      }, this.getConfigVal('agchart'));
      console.log('agcreatopts', this.chartOpts);
      this.chart = agCharts.AgChart.create(this.chartOpts);
      //this.set('data', this.getConfigVal('data'));
    }
  };
  AgChartElement.prototype.staticEnvironmentDescriptor = function (myname) {
    return lib.extendWithConcat(
      WebElement.prototype.staticEnvironmentDescriptor.call(this, myname)||{},
      mylib.gridmixins.Themable.prototype.staticEnvironmentDescriptor.call(this, myname),
      {}
    );
  };
  AgChartElement.prototype.set_data = function (data) {
    var agchartopts;
    this.data = data;
    if (!this.chart) {
      return true;
    }
    this.chartOpts.data = data;
    this.apiUpdate();
    return true;
  };
  AgChartElement.prototype.get_series = function () {
    return this.chartOpts ? this.chartOpts.series : null;
  };
  AgChartElement.prototype.set_series = function (series) {
    if (!this.chartOpts) {
      return true;
    }
    this.chartOpts.series = series;
    this.apiUpdate();
    return true;
  };
  AgChartElement.prototype.get_titletext = function () {
    return this.chartOpts ? 
      (this.chartOpts.title ? this.chartOpts.title.text : null)
      :
      null;
  };
  AgChartElement.prototype.set_titletext = function (titletext) {
    this.chartOpts.title = this.chartOpts.title || {};
    this.chartOpts.title.text = titletext||'';
    this.apiUpdate();
    return true;
  };
  AgChartElement.prototype.apiUpdate = function () {
    agCharts.AgChart.update(this.chart, this.chartOpts);
  };

  AgChartElement.prototype.respondToThemeChange = function (oldtheme, newtheme) {
    this.$element.removeClass(oldtheme);
    this.$element.addClass(newtheme);
    this.chartOpts.theme = newtheme;
    this.apiUpdate();
  };

  applib.registerElementType('AgChart', AgChartElement);
}
module.exports = createChart;
