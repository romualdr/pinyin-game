var fs = require('fs');
var Datastore = require('nedb');
var async = require('async');
var _ = require('underscore');
var FOLDER = __dirname + '/_cache';
var DATABASES = {};

// Error
function DatabaseError(message) {
	this.name = "DatabaseError";
	this.status = 500;
	this.hidden = true;
	this.message = message;
}

DatabaseError.prototype.toString = function() {
	return this.name + ':' + this.message;
};

// Class

function Database(name, indexes) {
	if (DATABASES[name])
		return DATABASES[name];
	if (name && !global._TEST_)
		this.database = new Datastore({ filename: FOLDER + '/' + name + '.db', autoload: true });
	else
		this.database = new Datastore();
	DATABASES[name] = this;
	_ensureIndexes(this.database, indexes);
	return this;
	// TODO: Show warning for in memory-only
}

Database.prototype.save = function(doc, callback) {
	if (doc.id) return this._update(doc, callback);
	this.database.insert(doc, function (err, res) {
		if (err) return callback(new DatabaseError("Unable to insert document [" + err + "]"));
		callback(null, _docOut(res));
	});
	return this;
};

Database.prototype.get = function (id, callback) {
	this.database.findOne({ _id: id }, function (err, res) {
		if (err) return callback(new DatabaseError("Unable to get document [" + id + "] [" + err + "]"));
		if (!res) return callback(new DatabaseError("Cannot find document [" + id + "]"));
		return callback(null, _docOut(res));
	});
	return this;
};

Database.prototype.delete = function (id, callback) {
	this.database.remove({ _id: id }, function (err, res) {
		if (err) return callback(new DatabaseError("Unable to remove document [" + id + "] [" + err + "]"));
		if (!res) return callback(new DatabaseError("Cannot find document [" + id + "]"));
		return callback(null, { ok: true });
	});
	return this;
};

Database.prototype._update = function(doc, callback) {
	var self = this;
	var id = doc.id;

	this.database.update({ _id: id }, doc, function (err, res) {
		if (err) return callback(new DatabaseError("Unable to update document [" + id + "] [" + err + "]"));
		return self.get(id, callback);
	});
	return this;
};
/*
	database.find(query, callback);
	database.find(query, options, callback);
*/
Database.prototype.find = function(query, options, callback) {
	var that = this;
	var result = {};

	if (typeof (options) === "function" && !callback) {
		callback = options;
		options = {};
	}

	var q = this.database.find(query || {});
	if (options.sort)
		q = q.sort(options.sort);

	if (options.start) {
		q = q.skip(options.start);
	}
	result.start = options.start || 0;

	if (options.fields) {
		var project = {};
		for (var i in options.fields)
			project[options.fields[i]] = 1;
		q = q.projection(project);
	}

	q = q.limit(options.limit || 25);
	result.limit = options.limit || 25;

	// Execute everything
	async.waterfall([
		function (next) {
			if (!options.count) return next(null, false);
			that.database.count(query, next);
		},
		function (count, next) {
			if (count)
				result.count = count;
			q.exec(next);
		}	
	], function (err, res) {
		if (err) return callback(new DatabaseError("Unable to find documents [" + err + "]"));
		for (var i in res) {
			res[i] = _docOut(res[i]);
		}
		result.hits = res;
		return callback(null, result);
	});
	return this;
};

/*
	database.findAll(callback);
	database.findAll(options, callback);
*/
Database.prototype.findAll = function (options, callback) {
	if (typeof (options) === "function" && !callback) {
		callback = options;
		options = {};
	}
	return this.find({}, options, callback);
};

// Private functions

/*
	@desc: Replace _id by id;
	@return: Document modified
	@params: Document
*/
function _docOut(doc) {
	doc.id = doc._id;
	delete doc._id;
	return doc;
}

/*
	@desc: Ensure indexs on database
	@return: nothing
	@params: Database instance, indexes
*/
/*
	'email'
	[{fieldName: 'email', unique: true }, {...}]
	{ fieldName: 'email', unique: true }
	{ 'email': true, 'name': true },
	{ 'email': { unique: true }, 'name': { unique: true }}
*/
function _ensureIndexes(database, indexes) {
	if (!indexes) return;
	if (!Array.isArray(indexes))
		indexes = [indexes];
	for (var i = 0; i < indexes.length; ++i) {
		if (typeof indexes[i] === 'string')
			indexes[i] = { fieldName: indexes[i] };
		if (_.isObject(indexes[i]) && !indexes[i].hasOwnProperty('fieldName')) {
			var obj = indexes.splice(i, 1)[0];
			--i;
			for (var key in obj) {
				
				if (_.isObject(obj[key])) {
					obj[key].fieldName = key;
					indexes.push(obj[key]);
				}
				if (typeof obj[key] === 'boolean' && obj[key])
					indexes.push({ fieldName: key });
			}
		}
	}
	async.each(indexes, function (index, asyncCb) {
		database.ensureIndex(index, asyncCb);
	}, function (err) {
		if (err) return console.log(err);
	});
}

// Is _cache exist ?
try {
	fs.readdirSync(FOLDER);
} catch (e) {
	fs.mkdirSync(FOLDER);
}

module.exports = Database;