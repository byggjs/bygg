'use strict';

var Kefir = require('kefir');

module.exports = function debounce(wait, maxWait) {
    var firstValueAt = null;
    var pendingSink = null;

    maxWait = maxWait || wait;

    return function (value) {
        if (pendingSink !== null) {
            pendingSink(Kefir.END);
            pendingSink = null;
        }

        if (firstValueAt === null) {
            firstValueAt = new Date();
        }

        return Kefir.fromBinder(function (sink) {
            var timer;

            pendingSink = sink;

            var now = new Date();
            var elapsed = now - firstValueAt;
            if (elapsed >= maxWait) {
                pushValue();
            } else {
                var delay = Math.min(wait, maxWait - elapsed);
                timer = setTimeout(pushValue, delay);
            }

            function pushValue() {
                timer = null;
                sink(value);
                sink(Kefir.END);
            }

            return function dispose() {
                firstValueAt = null;
                pendingSink = null;

                if (timer !== null) {
                    clearTimeout(timer);
                    timer = null;
                }
            };
        });
    };
}
