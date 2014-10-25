var async = require('async');
global.io = new (require('./modules/io-core'))({
	plugins: ['http', 'socket', 'session', 'static'],
	http: {
		port: process.env.PORT || 1338
	}
});
global.Database = require('./modules/database');

var CHARACTERS = new Database('characters', 'character');
var USERS = new Database('users', 'username');

io.static.serve('public');

io.http.on('get', '/api', {
	name: "Pinyin Game",
	version: '0.1.0',
	message: "Welcome to Pinyin Game API"
});

// User API

io.http.on('get', '/api/user', function (params, callback, session) {
	if (!session.user) return callback('You are not logged in');
	return callback(null, session.user); 
});

io.http.on('post', '/api/user', {
	password: { type: 'string', minLength: 8 },
	username: { type: 'string', minLength: 4 }
}, function (params, callback, session) {
	if (session && session.user) return callback(null, session.user);
	params.rank = "member";
	async.waterfall([
		function (next) {
			return USERS.find({ username: params.username }, next);
		},
		function (users, next) {
			if (!users.hits.length) return USERS.save(params, next);
			if (users.hits[0].password !== params.password) return next('Wrong username or password.');  
			return next(null, users.hits[0]);
		},
		function (user, next) {
			session.user = user;
			return next(null, user);
		}
	], callback);
});

io.http.on('get', '/api/logout', function (params, callback, session) {
	delete session.user;
	return callback(null, { ok: true });
});

io.http.on('get', '/api/words', function (params, callback) {
	return CHARACTERS.findAll({ limit: params.limit, start: params.start, count: true }, callback);
});

// USER API

io.http.use(function (params, callback, session) {
	async.waterfall([
		function (next) {
			if (!session || !session.user || !session.user.id) return next(true);
			return USERS.get(session.user.id, next);
		},
		function (user, next) {
			session.user = user;
			return next(null); 
		}
	], function (err) {
		if (err) return callback("You are not logged in.");
		return callback(null);
	});
});

var _scores = {};

io.http.on('post', '/api/score', {
	score: { type: 'number' }
}, function (params, callback) {
	async.waterfall([
		function (next) {
			return CHARACTERS.find({ character: params.character }, next);
		},
		function (results, next) {
			if (results.hits.length) return next("Already exists");
			params.english = params.english.toLowerCase();
			params.pinyin = params.pinyin.toLowerCase();
			return CHARACTERS.save(params, next);
		}
	], callback);
});

// ADMIN API

io.http.use(function (params, callback, session) {
	async.waterfall([
		function (next) {
			if (!session || !session.user || !session.user.id || session.user.rank !== "admin") return next(true);
			return next(null);
		}
	], function (err) {
		if (err) return callback("Unauthorized access");
		return callback(null);
	});
});

io.http.on('post', '/api/word', {
	character: { type: 'string', minLength: 1 },
	english: { type: 'string', minLength: 3 },
	pinyin: { type: 'string', minLength: 2 }
}, function (params, callback) {
	async.waterfall([
		function (next) {
			return CHARACTERS.find({ character: params.character }, next);
		},
		function (results, next) {
			if (results.hits.length) return next("Already exists");
			params.english = params.english.toLowerCase();
			params.pinyin = params.pinyin.toLowerCase();
			return CHARACTERS.save(params, next);
		}
	], callback);
});

io.http.on('delete', '/api/word/:id', {
	id: { type: 'string', minLength: 5 }
}, function (params, callback) {
	async.waterfall([
		function (next) {
			return CHARACTERS.get(params.id, next);
		},
		function (result, next) {
			return CHARACTERS.delete(params.id, next);
		}
	], callback);
});