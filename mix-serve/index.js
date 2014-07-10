var express = require('express');
var http = require('http');
var livereload = require('connect-livereload');
var mime = require('mime');
var mix = require('mix');
var morgan = require('morgan');
var parseurl = require('parseurl');
var tinylr = require('tiny-lr');

module.exports = function (port) {
    var tinylrServer = tinylr();
    var app = express()
        // .use(morgan())
        .use(livereload({ port: port }))
        .use(onRequest)
        .use(tinylrServer.handler.bind(tinylrServer));
    var server = http.createServer(app);
    server.on('upgrade', tinylrServer.websocketify.bind(tinylrServer));
    server.listen(port);

    var currentTree = new mix.Tree([]);
    function onRequest(req, res, next) {
        if (req.method === 'GET') {
            var pathname = parseurl(req).pathname;
            if (pathname === '/') {
                pathname = '/index.html';
            }
            var node = currentTree.findNodeByName(pathname.substr(1));
            if (node !== null) {
                var data = node.data;
                res.writeHead(200, {
                    'Content-Length': data.length,
                    'Content-Type': mime.lookup(node.name)
                });
                res.end(data);
                return;
            }
        }

        next();
        // TODO: try_files
    }

    return function (tree) {
        currentTree = tree;
        tinylr.changed('/not-used-anyway');
        return tree;
    };
};
