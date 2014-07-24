'use strict';

var mix = require('mix');

var SOURCEMAPPINGURL_PREFIX = '\n//# sourceMappingURL=';

module.exports = function (from, to) {
    return function (tree) {
        var nodes = tree.nodes.map(function (node) {
            var outputNode = tree.cloneNode(node);

            outputNode.name = node.name.replace(from, to);

            outputNode.siblings = node.siblings.map(function (sibling) {
                var outputSibling = tree.cloneSibling(sibling, outputNode);
                outputSibling.name = sibling.name.replace(from, to);
                return outputSibling;
            });

            if (outputNode.metadata.mime === 'application/javascript') {
                var source = outputNode.data.toString('utf8');
                var sourceMapUrlStart = source.lastIndexOf(SOURCEMAPPINGURL_PREFIX);
                if (sourceMapUrlStart !== -1) {
                    var sourceMapUrlEnd = source.indexOf('\n', sourceMapUrlStart + SOURCEMAPPINGURL_PREFIX.length);
                    if (sourceMapUrlEnd === -1) {
                        sourceMapUrlEnd = source.length;
                    }
                    var sourceMapUrlComment = source.substring(sourceMapUrlStart, sourceMapUrlEnd);
                    sourceMapUrlComment = sourceMapUrlComment.replace(from, to);
                    source = source.substring(0, sourceMapUrlStart) + sourceMapUrlComment + source.substring(sourceMapUrlEnd);
                    outputNode.data = new Buffer(source, 'utf8');
                }
            }

            return outputNode;
        });
        return new mix.Tree(nodes);
    };
};
