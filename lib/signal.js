'use strict';

var mixIn = require('mout/object/mixIn');

var Signal = function (base) {
    this.value = base;
    this.listeners = [];
};

Signal.prototype.push = function (value) {
    this.value = value;
    this.listeners.forEach(function (listener) {
        listener(this.value);
    }, this);
    return this;
};

Signal.prototype.map = function (fun) {
    this.listeners.push(fun);
    if (this.value !== undefined) {
        fun(this.value);
    }
    return this;
};

Signal.prototype.pipe = function (fun) {
    var output = new Signal();

    this.map(function (upstream) {
        fun(upstream).map(function (downstream) {
            output.push(downstream);
        });
    });

    return output;
};

Signal.create = function (base) {
    return new Signal(base);
};

Signal.constant = function (value) {
    var signal = new Signal(value);
    delete signal.push;
    return signal;
};

// apply :: ((any()...) -> any(), [signal(any())]) -> any()
var apply = function (fun, signals) {
    var values = signals
        .map(function (signal) { return signal.value; })
        .filter(function (value) { return value !== undefined; });
    if (values.length === signals.length) {
        return fun.apply(null, values);
    } else {
        return undefined;
    }
};

// combine :: ((a, b, ...) -> result, signal(a), signal(b), ...) -> Signal(result)
Signal.combine = function (fun) {
    var inputs = Array.prototype.slice.call(arguments, 1);
    var output = new Signal(apply(fun, inputs));
    inputs.forEach(function (input) {
        input.map(function () {
            var value = apply(fun, inputs);
            if (value !== undefined) {
                output.push(value);
            }
        });
    });
    return output;
};

module.exports = Signal.create;
mixIn(module.exports, {
    constant: Signal.constant,
    combine: Signal.combine
});
