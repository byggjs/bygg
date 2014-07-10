var UglifyJS = require('uglify-js');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');

module.exports = function (options) {
    options = options || {};

    return function (tree) {
        var start = new Date();
        var nodes = tree.nodes.map(function (node) {
            var source = node.data.toString('utf8');
            var result = UglifyJS.minify([source], mixIn({}, options, {
                fromString: true
            }));
            return mixIn({}, node, {
                data: new Buffer(result.code, 'utf8')
            });
        });
        console.log('minified JS in ' + (new Date() - start) + ' ms');
        return new mix.Tree(nodes);
    };
};
