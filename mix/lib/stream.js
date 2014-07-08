module.exports = Stream;

function Stream(observable) {
    this._observable = observable;
}

Stream.prototype.pipe = function (sink) {
    return new Stream(this._observable.flatMap(sink));
};
