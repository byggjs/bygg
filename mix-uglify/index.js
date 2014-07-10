var UglifyJS = require('uglify-js');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');

module.exports = function (options) {
    options = options || {};

    return function (tree) {
        var sources = tree.nodes.map(function (node) { return node.data.toString('utf8'); });
        var start = new Date();
        var result = UglifyJS.minify(sources, mixIn({}, options, {
            fromString: true
        }));
        console.log('minified JS in ' + (new Date() - start) + ' ms');
        return new mix.Tree([
            mixIn({}, tree.nodes[0], {
                data: new Buffer(result.code, 'utf8')
            })
        ]);
    };
};
