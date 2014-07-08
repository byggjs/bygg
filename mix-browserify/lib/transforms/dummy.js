var Kefir = require('kefir');

function dummy(module) {
    return Kefir.fromBinder(function (sink) {
        sink(module);
        sink(Kefir.END);
    });
}

module.exports = dummy;
