var Kefir = require('kefir');
var Mix = require('mix');

module.exports = function () {
    return new Write();
};

Write.prototype = Object.create(Mix.prototype);
Write.prototype.constructor = Write;

function Write() {
    Mix.call(this);

    this.sink = new Kefir.bus();
    this.sink.onNewValue(this._onNewValue, this);
}

Write.prototype._onNewValue = function (tree) {
    // TODO
};
