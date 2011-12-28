var express = require('express'), app = module.exports.app = express.createServer();

app.configure(function() {
	app.use(express.bodyDecoder());
});

var messages = require('./resources/messages');

// start the api server.
app.listen('/tmp/nodejs-geohello.sock');