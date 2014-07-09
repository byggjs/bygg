var mix = require('mix');
var browserify = require('mix-browserify');
var files = require('mix-files');
var minify = require('mix-minify');
var rev = require('mix-rev');
var serve = require('mix-serve');
var stats = require('mix-stats');
var write = require('mix-write');

var html = files({ base: 'src', globs: 'index.html' });
var scripts = files({ base: 'src', globs: 'scripts/app.jsx' })
    .pipe(browserify('scripts/app.js', {
        extensions: ['.js', '.jsx'],
        configure: function (b) {
            b.transform('reactify');
            b.require('../node_modules/react/react.js', {expose: 'react'});
        }
    }))
    .pipe(minify());
var styles = files({ base: 'src', globs: 'styles/*.css' }).pipe(minify());
var build = mix.combine(html, scripts, styles).pipe(rev()).pipe(stats());
build.pipe(write('build/'));
build.pipe(serve(3000));
