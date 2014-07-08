var hello = require('./hello');
var world = require('./world');
var message = document.createElement('h1');
message.textContent = hello.message + ' ' + world.message;
document.getElementById('app').appendChild(message);
