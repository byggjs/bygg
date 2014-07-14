'use strict';

var express = require('express');
var http = require('http');
var livereload = require('connect-livereload');
var mix = require('mix');
var morgan = require('morgan');
var parseurl = require('parseurl');
var tinylr = require('tiny-lr');

module.exports = function (port, behavior) {
    var tinylrServer = tinylr();
    var app = express()
        // .use(morgan())
        .use(livereload({ port: port }))
        .use(staticMiddleware);
    if (behavior) {
        app = behavior(app, getNodeData);
    }
    app
        .use(fileMiddleware('index.html'))
        .use(tinylrServer.handler.bind(tinylrServer));
    var server = http.createServer(app);
    server.on('upgrade', tinylrServer.websocketify.bind(tinylrServer));
    server.listen(port);

    var currentTree = new mix.Tree([]);

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
        }
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
        currentTree = tree;
        tinylr.changed('/not-used-anyway');
        return tree;
    };
};
