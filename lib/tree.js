'use strict';

var extend = require('extend');
var path = require('path');
var fs = require('fs');
var convertSourceMap = require('convert-source-map');

function Tree(nodes) {
    this.nodes = nodes;
}

Tree.prototype.findNodeByName = function (name) {
    return this.findNode(function (n) {
        return n === name;
    });
};

Tree.prototype.findNodeByPath = function (absPath) {
    return this.findNode(function (name, base) {
        return path.join(base, name) === absPath;
    });
};

Tree.prototype.findNode = function (predicate) {
    for (var nodeIndex = 0; nodeIndex !== this.nodes.length; nodeIndex++) {
        var node = this.nodes[nodeIndex];
        if (predicate(node.name, node.base)) {
            return node;
        }
        for (var siblingIndex = 0; siblingIndex !== node.siblings.length; siblingIndex++) {
            var sibling = node.siblings[siblingIndex];
            if (predicate(sibling.name, node.base)) {
                return {
                    name: sibling.name,
                    base: node.base,
                    data: sibling.data,
                    stat: sibling.stat,
                    metadata: {},
                    siblings: []
                };
            }
        }
    }
    return null;
};

Tree.create = function (nodes) {
    return new Tree(nodes);
};

Tree.merge = function () {
    var result = new Tree([]);
    for (var i = 0; i !== arguments.length; i++) {
        var tree = arguments[i];
        result.nodes.push.apply(result.nodes, tree.nodes);
    }
    return result;
};

Tree.cloneNode = function (node) {
    var clone = extend({}, node);
    clone.metadata = extend({}, node.metadata);
    clone.siblings = node.siblings.slice();
    return clone;
};

Tree.cloneSibling = function (sibling, node) {
    return extend({}, sibling);
};

var SourceMap = {};

SourceMap.get = function (node) {
    if (node.metadata.sourceMap !== undefined) {
        var data = node.siblings[node.metadata.sourceMap].data.toString('utf-8');
        return JSON.parse(data);
    } else {
        return undefined;
    }
};

SourceMap.name = function (node) {
    return path.basename(node.name) + '.map';
};

SourceMap.set = function (node, sourceMap, options) {
    options.annotate = options.annotate || false;
    options.sourceBase = options.sourceBase || false;

    var basedir = path.dirname(node.name);

    if (options.sourceBase) {
        sourceMap.sources = sourceMap.sources.map(function (source) {
            return path.relative(options.sourceBase, source);
        });
    }

    if (sourceMap.sourcesContent === undefined || sourceMap.sourcesContent.length === 0) {
        sourceMap.sourcesContent = sourceMap.sources.map(function (source) {
            return fs.readFileSync(path.join(node.base, basedir, source), {encoding: 'utf-8'});
        });
    }

    var outputNode = Tree.cloneNode(node);

    if (node.metadata.sourceMap !== undefined) {
        var sibling = Tree.cloneSibling(outputNode.siblings[outputNode.metadata.sourceMap], outputNode);
        sibling.data = new Buffer(JSON.stringify(sourceMap), 'utf-8');
        outputNode.siblings[outputNode.metadata.sourceMap] = sibling;
    } else {
        outputNode.metadata.sourceMap = outputNode.siblings.length;
        outputNode.siblings.push({
            name: path.join(basedir, SourceMap.name(node)),
            data: new Buffer(JSON.stringify(sourceMap), 'utf-8')
        });

        options.annotate = true;
    }

    if (options.annotate) {
        var data = outputNode.data.toString('utf-8');
        var commentFreeData = convertSourceMap.removeMapFileComments(data);

        var annotation;
        if (outputNode.metadata.mime === 'application/javascript') {
            annotation = '\n//# sourceMappingURL=' + SourceMap.name(node);
        } else if (outputNode.metadata.mime === 'text/css') {
            annotation = '\n/*# sourceMappingURL=' + SourceMap.name(node) +'*/';
        }

        outputNode.data = new Buffer(data + annotation, 'utf-8');
    }

    return outputNode;
};

SourceMap.unset = function (node) {
    if (node.metadata.sourceMap !== undefined) {
        var outputNode = Tree.cloneNode(node);
        outputNode.siblings.splice(node.metadata.sourceMap, 1);
        delete outputNode.metadata.sourceMap;

        var data = outputNode.data.toString('utf-8');
        var commentFreeData = convertSourceMap.removeMapFileComments(data);
        outputNode.data = new Buffer(commentFreeData, 'utf-8');

        return outputNode;
    }

    return node;
};

module.exports = extend(Tree.create, {
    merge: Tree.merge,
    cloneNode: Tree.cloneNode,
    cloneSibling: Tree.cloneSibling,
    sourceMap: SourceMap
});
