var inspector = require('schema-inspector');
var async = require('async');

/*----------------

 Private methods

----------------*/

/*
	@desc: Merge parameters for request
	@return: 
	@params: Parameters
*/
function _mergeParams(req, callback) {
	var hash = req.query || {};
	for (var key in req.body) { hash[key] = req.body[key]; }
	for (var key in req.params) {
		if (parseInt(key, 10).toString() !== key) // is not a number
			hash[key] = req.params[key];
	}
	return callback(null, hash);
};

/*
	@desc: Remove forbidden keys
	@return: Return clean hash
	@params: Object
*/
function _removeForbidden(forbiddens, hash) {
	for (var key in hash) {
		if (typeof key === 'string' && (forbiddens.indexOf(key) !== -1 || key.indexOf('_') === 0))
			delete hash[key];
		else if (typeof hash[key] === "object")
			_removeForbidden(forbiddens, hash[key]);
	}
	return hash;
}

/*
	@desc: Bind parameters to default process for routing
	@return: null
	@params: validation function or hash, function(params, callback)
*/
function _bind(io, validation, fn) {
	// If validation is not a function, make it one !
	if (validation && typeof validation !== "function") {
		validation = (function (schema) {
			schema = { type: 'object', 'properties': schema };
			return function (hash, callback) {
				inspector.validate(schema, hash, function (err, result) {
					if (err) return callback(err);
					if (result && !result.valid) return callback(result.error);
					return callback(null, hash);
				});
			}
		})(validation);
	}


	return function (req, res, next) {
		async.waterfall([
			function (next2) {
				return _mergeParams(req, next2);
			},
			function (hash, next2) {
				if (!validation) return next2(null, hash);
				return validation(hash, next2);
			},
			function (hash, next2) {
				if (typeof fn !== 'function') return next2(null, fn);
				if (req.session) {
					return fn(hash, next2, req.session, {req: req, res: res});
				}
				return fn(hash, next2, {req: req, res: res});
			}
		], function (err, result) {
			if (err) return res.status(err.status || 500).send((typeof err === 'string' ? { message: err } : err));
			return res.send(_removeForbidden(io.config.http.filter || ['password'], result));
		});
	};
}

/*----------------

 Public methods

----------------*/

module.exports = function (io) {
	var _express = require('express');
	var _bodyParser = require('body-parser');
	var _app = _express();
	var _server = require('http').Server(_app);
	var _plugin = io.register('http');
	var _launched = false;

	_app.use(_bodyParser.json());
	_app.use(_bodyParser.urlencoded());

	_plugin('_server', _server);
	_plugin('_app', _app);

	/*
		@desc: Middleware handler
		@params: function(params, callback)
	*/
	_plugin('use', function (fn) {
		_app.use(function (req, res, next) {
			async.waterfall([
				function (next2) {
					return _mergeParams(req, next2);
				},
				function (hash, next2) {
					if (typeof fn !== 'function') return next2(null, fn);
					if (req.session) {
						return fn(hash, next2, req.session, {req: req, res: res});
					}
					return fn(hash, next2, {req: req, res: res});
				}
			], function (err, result) {
				if (err) return res.status(err.status || 500).send((typeof err === 'string' ? { message: err } : err));
				return next();
			});
		});
	});
	
	/*
		@desc: Bind to express
		@params: HTTP Method, path, function(params, callback)
	*/
	_plugin('on', function (method, path, validation, fn) {

		if (!_launched) {
			_server.listen(io.config.http.port || 3000);
			_launched = true;
		}

		if (validation && !fn) {
			fn = validation;
			validation = null;
		}

		if (!_app[method])
			throw "Method [" + method + "] unknown.";
		_app[method](path, _bind(io, validation, fn));
	});
}