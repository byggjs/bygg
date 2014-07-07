var Kefir = require('kefir');
var Tree = require('./tree');

module.exports = Mix;

function Mix() {
    this.sink = null;

    this.source = null;
    this._sources = [];
}

Mix.prototype.add = function (mix) {
    if (mix.source === null) {
        throw new Error(this.constructor.name + ': Cannot add mix without a source');
    }
    this._sources.push(mix.source);
    this.source = Kefir.combine(this._sources, Tree.merge);
    return this;
};

Mix.prototype.pipe = function (mix) {
    this.tee(mix);
    return mix;
};

Mix.prototype.tee = function () {
    if (this.source === null) {
        throw new Error(this.constructor.name + ': Cannot pipe/tee from mix without a source');
    }
    for (var i = 0; i !== arguments.length; i++) {
        var mix = arguments[i];
        if (mix.sink === null) {
            throw new Error(this.constructor.name + ': Cannot pipe/tee to mix without a sink');
        }
        mix.sink.plug(this.source);
    }
};
