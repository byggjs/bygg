'use strict';

var express = require('express');
var http = require('http');
var livereload = require('connect-livereload');
var morgan = require('morgan');
var parseurl = require('parseurl');
var tinylr = require('tiny-lr');
var chalk = require('chalk');
var mixlib = require('../lib');

var LIVERELOAD_PORT = 35729;

module.exports = function (port, behavior) {
    var receivedInitialTree = false;

    var tinylrServer = tinylr();
    tinylrServer.listen(LIVERELOAD_PORT);

    var app = express()
        .use(morgan('dev'))
        .use(livereload({ port: LIVERELOAD_PORT }))
        .use(staticMiddleware);
    if (behavior) {
        app = behavior(app, getNodeData);
    }
    app.use(fileMiddleware('index.html'));
    app.listen(port);
    var currentTree = mixlib.tree([]);

    function staticMiddleware(req, res, next) {
        var pathname = parseurl(req).pathname;
        return fileMiddleware(pathname.substr(1))(req, res, next);
    }

    function fileMiddleware(name) {
        return function (req, res, next) {
            var node = currentTree.findNodeByName(name);
            if (node !== null && (req.method === 'GET' || req.method === 'HEAD')) {
                var data = node.data;
                res.writeHead(200, {
                    'Content-Length': data.length,
                    'Content-Type': node.metadata.mime
                });
                if (req.method === 'GET') {
                    res.end(data);
                } else {
                    res.end();
                }
            } else {
                next();
            }
        };
    }

    function getNodeData(name, callback) {
        var node = currentTree.findNodeByName(name);
        if (node !== null) {
            callback(null, node.data);
        } else {
            callback(new Error('not-found'));
        }
    }

    return function (tree) {
        var message;
        if (!receivedInitialTree) {
            receivedInitialTree = true;
            message = 'Server started on port ' + chalk.yellow(port);
        } else {
            tree.nodes.forEach(function (node, i) {
                if (currentTree.nodes[i] !== node) {
                    tinylr.changed('/' + node.name);
                }
            });

            message = 'Triggered LiveReload';
        }

        currentTree = tree;

        mixlib.logger.log('serve', message);

        return tree;
    };
};
