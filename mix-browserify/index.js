var Kefir = require('kefir');
var esprima = require('esprima');
var Mix = require('mix');
var Tree = Mix.Tree;
var dummy = require('./lib/transforms/dummy');
var requireDependencies = require('./lib/transforms/require-dependencies');

module.exports = function () {
    return new Browserify();
};

Browserify.prototype = Object.create(Mix.prototype);
Browserify.prototype.constructor = Browserify;

function Browserify(options) {
    options = options || {};

    Mix.call(this);

    var transforms = (options.transforms || []).concat([dummy, requireDependencies]);

    this.sink = new Kefir.bus();

    var stream = this.sink.map(this._treeToModule);
    stream = transforms.reduce(function (s, transform) {
        return s.flatMap(function (value) {
            return transform.call(this, value);
        }.bind(this));
    }.bind(this), stream);

    stream.log();

    this.source = stream.map(this._moduleToTree);
    this.source.log();
}

Browserify.prototype._treeToModule = function (tree) {
    if (tree.nodes.length > 1) {
        throw new Error('Only one file may be specified for browserification');
    }

    var node = tree.nodes[0];
    var ast = esprima.parse(node.data);

    return {
        filename: node.name,
        ast: ast
    };
};

Browserify.prototype._moduleToTree = function (program) {
    console.log('_moduleToTree:', program);
    return new Tree([]);
};

Browserify.prototype._require = function (path) {
    return Kefir.fromBinder(function (sink) {
        console.log('hola');
        process.nextTick(function () {
            console.log('end:', path);
            sink('foo:' + path);
            process.nextTick(function () {
                sink(Kefir.END);
            });
        });
    });
};
