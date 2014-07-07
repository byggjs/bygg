var connect = require('connect');
var Kefir = require('kefir');
var http = require('http');
var livereload = require('connect-livereload');
var mime = require('mime');
var Mix = require('mix');
var Tree = Mix.Tree;
var morgan = require('morgan');
var parseurl = require('parseurl');
var tinylr = require('tiny-lr');

module.exports = function (port) {
    return new Serve(port);
};

Serve.prototype = Object.create(Mix.prototype);
Serve.prototype.constructor = Serve;

function Serve(port) {
    Mix.call(this);

    this.sink = new Kefir.bus();
    this.sink.onNewValue(this._onNewValue, this);

    this._tree = new Tree([]);

    this._tinylr = tinylr();
    var app = connect()
        // .use(morgan())
        .use(livereload({ port: port }))
        .use(this._onRequest.bind(this))
        .use(this._tinylr.handler.bind(this._tinylr));
    var server = http.createServer(app)
    server.on('upgrade', this._tinylr.websocketify.bind(this._tinylr));
    server.listen(port);
}

Serve.prototype._onNewValue = function (tree) {
    this._tree = tree;
    tinylr.changed('/not-used-anyway');
    tree.notifyOrigins({ name: 'stream-updates' });
};

// TODO: try_files

Serve.prototype._onRequest = function (req, res, next) {
    if (req.method === 'GET') {
        var pathname = parseurl(req).pathname;
        if (pathname === '/') {
            pathname = '/index.html';
        }
        for (var i = 0; i !== this._tree.nodes.length; i++) {
            var node = this._tree.nodes[i];
            if (node.name === pathname) {
                var data = node.data;
                res.writeHead(200, {
                    'Content-Length': data.length,
                    'Content-Type': mime.lookup(node.name)
                });
                res.end(data);
                return;
            }
        }
    }

    next();
};
