'use strict';

var Kefir = require('kefir');

module.exports = Stream;

function Stream(value) {
    if (typeof value === 'function') {
        var subscribe = value;
        this._observable = Kefir.fromBinder(function (sink) {
            return subscribe({
                push: sink,
                close: function (value) {
                    if (typeof value !== 'undefined') {
                        sink(value);
                    }
                    sink(Kefir.END);
                }
            });
        }, this);
    } else {
        this._observable = value;
    }

    this._consumers = 0;
    process.nextTick(function () {
        if (this._consumers === 0) {
            this._consumers++;
            this._observable.onValue(function () {});
        }
    }.bind(this));
}

Stream.prototype.pipe = function (sink) {
    this._consumers++;
    return new Stream(this._observable.flatMap(function (input) {
        output = sink(input);
        if (output instanceof Stream) {
            return output._observable;
        } else {
            return Kefir.once(output);
        }
    }));
};
