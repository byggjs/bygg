var Mix = require('mix');
var browserify = require('mix-browserify');
var files = require('mix-files');
var minify = require('mix-minify');
var rev = require('mix-rev');
var serve = require('mix-serve');
var stats = require('mix-stats');
var write = require('mix-write');

var mix = new Mix();
mix.add(files({ base: 'src', globs: 'index.html' }));
mix.add(files({ base: 'src', globs: 'scripts/app.js' }).pipe(browserify()).pipe(minify()));
mix.add(files({ base: 'src', globs: 'styles/*.css' }).pipe(minify()));
mix.pipe(rev()).tee(stats().pipe(write('build/')), serve(3000));
// mix.pipe(rev()).pipe(stats()).pipe(write('build/'));
