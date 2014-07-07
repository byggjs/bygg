var hello = require('./hello');
var message = document.createElement('h1');
message.textContent = hello.message;
document.getElementById('app').appendChild(message);
