module.exports = ['http', function (io, http) {
	var _sockets = require('socket.io')(http._server);
	var _plugin = io.register('socket');
	
	_plugin('on', _sockets.on.bind(_sockets));
}];