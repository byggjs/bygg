var Kefir = require('kefir');
var Mix = require('./mix');

module.exports = Transform;

function Transform() {
}

Transform.prototype = Object.create(Mix.prototype);
Transform.prototype.constructor = Transform;

function Transform() {
    Mix.call(this);

    this.sink = new Kefir.bus();
    this.sink.onNewValue(this._onNewValue, this);

    this.source = Kefir.fromBinder(function (callback) {
        this._push = callback;
    }, this);
}

Transform.prototype._onNewValue = function (inputTree) {
    this._transform(inputTree, function (outputTree) {
        this._push(outputTree);
    }.bind(this));
};

Transform.prototype._transform = function (tree, next) {
    throw new Error(this.constructor.name + ' must implement _transform');
}
