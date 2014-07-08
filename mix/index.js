var Kefir = require('kefir');
var Stream = require('./lib/stream');
var Tree = require('./lib/tree');

function combine() {
    var observables = Array.prototype.map.call(arguments, function (stream) { return stream._observable; });
    return new Stream(Kefir.combine(observables, Tree.merge));
}

module.exports = {
    combine: combine,
    Stream: Stream,
    Tree: Tree
};
