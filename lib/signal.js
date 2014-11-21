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

Signal.prototype.listen = function (listener) {
    this.listeners.push(listener);
    return this;
};

Signal.prototype.pipe = function (fun) {
    var output = new Signal();
    var valueSignal;

    var mapValue = function (value) {
        var result = fun(value);
        if (result instanceof Signal) {
            valueSignal = result;
            if (result.value !== undefined) {
                output.push(result.value);
            }
            result.listen(function (downstream) {
                output.push(downstream);
            });
        } else {
            output.push(result);
        }
    };

    this.listen(mapValue);

    if (this.value !== undefined) {
        mapValue(this.value);
    }

    return output;
};

Signal.create = function () {
    return new Signal();
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
        input.listen(function () {
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
