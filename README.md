# Bygg
**Taking the pain out of build systems**

Ever feel like existing front-end build systems just get in your way? Say hello
to *Bygg*. The basic primitive isn't a single file, but a tree of files, and you
simply compose plugins into a graph that defines your build pipeline. Bygg takes
care of the rest. By leveraging functional reactive programming only the part of
the pipeline that actually changed is recomputed, and you'll see the result in
your browser just milliseconds later. No need to worry about live-reload, source
maps, or bending your build system to fit revving into the picture; Bygg's got
you covered.

## Documentation

Check out the [examples](https://github.com/oleavr/bygg-examples) to get
started.

## Sample `byggfile.js`

This file is just a quick sample to give you a taste of what Bygg does.

```js
var bygg = require('bygg');

var autoprefixer = require('bygg-plugins/autoprefixer');
var csswring = require('bygg-plugins/csswring');
var rev = require('bygg-plugins/rev');
var serve = require('bygg-plugins/serve');
var stats = require('bygg-plugins/stats');
var uglify = require('bygg-plugins/uglify');

bygg.task('serve', function (optimize) {
    return build(optimize)
        .pipe(bygg.write('build/'))
        .pipe(serve(3000));
}, [{ name: 'optimize', default: false, flag: true, abbr: 'o' }]);

bygg.task('build', function (optimize) {
    return build(optimize)
        .pipe(bygg.write('build/'))
        .pipe(stats());
}, [{ name: 'optimize', default: true, flag: true, abbr: 'o' }]);

var build = function (optimize) {
    var html = bygg.files('*.html');

    var styles = bygg
        .files('app.css')
        .pipe(autoprefixer('last 2 versions', 'ie 9'))
        .pipe(optimize ? csswring() : bygg.noop());

    var scripts = bygg
        .files('app.js')
        .pipe(optimize ? uglify() : bygg.noop());

    return bygg.combine(
        html,
        styles,
        scripts
    )
    .pipe(optimize ? rev() : bygg.noop());
};
```
