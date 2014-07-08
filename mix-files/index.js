var Kefir = require('kefir');
var Mix = require('mix');
var Tree = Mix.Tree;
var path = require('path');
var vfs = require('vinyl-fs');

module.exports = function (base, globs) {
    return new Files(base, globs);
};

Files.prototype = Object.create(Mix.prototype);
Files.prototype.constructor = Files;

function Files(options) {
    Mix.call(this);

    var globs;
    if (typeof options.globs === 'string') {
        globs = [options.globs];
    } else {
        globs = options.globs;
    }
    this._base = path.resolve(options.base);
    this._globs = globs.map(function (g) { return path.join(this._base, g) }, this);
    this._watching = false;

    this.source = Kefir.fromBinder(function (callback) {
        this._push = callback;
    }, this);

    this._events = new Kefir.bus();
    this._events.onNewValue(this._onEvent, this);

    this._pushNext = this._pushNext.bind(this);
    this._pushNext();
}

Files.prototype._pushNext = function () {
    var stream = vfs.src(this._globs, {
        base: this._base
    });
    var files = [];
    stream.on('data', function (file) {
        files.push(file);
    });
    stream.on('end', function () {
        var tree = new Tree(files.map(this._fileToNode, this), this._events);

        this._push(tree);
    }.bind(this));
};

Files.prototype._onEvent = function (event) {
    if (event.name === 'stream-updates' && !this._watching) {
        this._watching = true;
        vfs.watch(this._globs, {}, this._pushNext);
    }
};

Files.prototype._fileToNode = function (file) {
    return {
        name: path.relative(this._base, file.path),
        base: this._base,
        data: file.contents,
        mode: file.stat.mode
    };
}
