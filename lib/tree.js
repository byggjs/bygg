'use strict';

var extend = require('extend');
var path = require('path');
var fs = require('fs');
var convertSourceMap = require('convert-source-map');

function Tree(nodes) {
    this.nodes = nodes;
}

Tree.prototype.cloneNode = function (node) {
    var clone = mixIn({}, node);
    clone.metadata = mixIn({}, node.metadata);
    clone.siblings = node.siblings.slice();
    return clone;
};

Tree.prototype.cloneSibling = function (sibling, node) {
    return mixIn({}, sibling);
};

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

    if (node.metadata.sourceMap !== undefined) {
        var sibling = Tree.prototype.cloneSibling(node.siblings[node.metadata.sourceMap], node);
        sibling.data = new Buffer(JSON.stringify(sourceMap), 'utf-8');
        node.siblings[node.metadata.sourceMap] = sibling;
    } else {
        node.metadata.sourceMap = node.siblings.length;
        node.siblings.push({
            name: path.join(basedir, SourceMap.name(node)),
            data: new Buffer(JSON.stringify(sourceMap), 'utf-8')
        });

        options.annotate = true;
    }

    if (options.annotate) {
        var data = node.data.toString('utf-8');
        var commentFreeData = convertSourceMap.removeMapFileComments(data);

        var annotation;
        if (node.metadata.mime === 'application/javascript') {
            annotation = '\n//# sourceMappingURL=' + SourceMap.name(node);
        } else if (node.metadata.mime === 'text/css') {
            annotation = '\n/*# sourceMappingURL=' + SourceMap.name(node) +'*/';
        }

        node.data = new Buffer(data + annotation, 'utf-8');
    }
};

SourceMap.unset = function (node) {
    if (node.metadata.sourceMap !== undefined) {
        node.siblings.splice(node.metadata.sourceMap, 1);
        delete node.metadata.sourceMap;

        var data = node.data.toString('utf-8');
        var commentFreeData = convertSourceMap.removeMapFileComments(data);
        node.data = new Buffer(commentFreeData, 'utf-8');

        return true;
    }

    return false;
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

module.exports = Tree.create;
module.exports.merge = Tree.merge;
module.exports.sourceMap = SourceMap;
