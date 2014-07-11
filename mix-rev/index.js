'use strict';

var crypto = require('crypto');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');

module.exports = function (options) {
    options = options || {};

    var entrypoint = options.entrypoint || 'index.html';

    return function (tree) {
        var deps = resolveDependencies(tree.nodes);

        var result = deps.reduce(function (context, dep) {
            var contents = dep.node.data.toString('utf8');
            Object.keys(dep.refs).forEach(function (reference) {
                var referencedNode = dep.refs[reference];
                contents = contents.replace(new RegExp(reference, 'g'), replacement(reference, context.nodeMap[referencedNode.name]));
            });
            var name = dep.node.name;
            var data = new Buffer(contents, 'utf8');
            var revision = md5(data).substr(0, 8);
            var extension = path.extname(name);
            var revName = (name !== entrypoint) ? joinPath(dirName(name), path.basename(name, extension) + '-' + revision + extension) : name;
            var revNode = mixIn({}, dep.node, {
                name: revName,
                data: data
            });
            revNode.metadata = mixIn({}, dep.node.metadata, { revision: revision });
            context.nameMap[name] = revName;
            context.nodeMap[name] = revNode;
            return context;
        }, { nodeMap: {}, nameMap: {} });

        var nodes = deps.reduce(function (nodes, dep) {
            var revNode = result.nodeMap[dep.node.name];
            if (dep.siblingOf) {
                var toplevel = result.nodeMap[dep.siblingOf.name];
                toplevel.siblings = toplevel.siblings.map(function (sibling) {
                    if (sibling === dep.node) {
                        return revNode;
                    } else {
                        return sibling;
                    }
                });
            } else {
                nodes.push(revNode);
            }
            return nodes;
        }, []);

        return new mix.Tree(nodes);
    };
};

function resolveDependencies(nodes, nodeMap, stack) {
    var deps = [];

    if (typeof nodeMap === 'undefined') {
        nodeMap = nodes.reduce(function (map, node) {
            map[node.name] = node;
            node.siblings.forEach(function (sibling) {
                map[sibling.name] = sibling;
            });
            return map;
        }, {});
    }

    stack = stack || [];

    forEachNode.call(nodes, function (node, siblingOf) {
        if (stack.indexOf(node) !== -1) {
            return;
        }
        stack.push(node);

        var refs = {};

        var contents = node.data.toString('utf8');
        var filepathRegex = /(?:\'|\"|\()([a-z0-9_@\-\/\.]{2,})/ig;
        var match;
        while ((match = filepathRegex.exec(contents))) {
            var reference = match[1];

            var referencedPath;
            if (reference.indexOf('/') === 0) {
                referencedPath = reference.substr(1);
            } else {
                referencedPath = joinPath(dirName(node.name), reference);
            }
            var referencedNode = nodeMap[referencedPath] || null;
            if (referencedNode !== null) {
                refs[reference] = referencedNode;
                Array.prototype.push.apply(deps, resolveDependencies([referencedNode], nodeMap, stack));
            }
        }

        deps.push({
            node: node,
            siblingOf: siblingOf,
            refs: refs
        });
    });

    return deps;
}

function replacement(reference, referencedNode) {
    return joinPath(dirName(reference), path.basename(referencedNode.name));
}

function forEachNode(callback) {
    Array.prototype.forEach.call(this, function (node) {
        callback(node, null);
        node.siblings.forEach(function (sibling) {
            callback(sibling, node);
        });
    });
}

function dirName(directory) {
    return path.dirname(directory).replace(/\\/g, '/');
}

function joinPath(directory, filename) {
    return path.join(directory, filename).replace(/\\/g, '/');
}

function md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}
