var Mix = require('./lib/mix');

Object.defineProperty(Mix, 'Transform', { value: require('./lib/transform') });
Object.defineProperty(Mix, 'Tree', { value: require('./lib/tree') });

module.exports = Mix;
