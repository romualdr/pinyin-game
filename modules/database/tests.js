var should = require('should');
var tester = new (require('teasier'))();
var database = new (require('../database'))();
var _results = [];

var OPTIONS = {
	docsToInsert: 120,
	defaultLimit: 25,
	defaultStart: 0
};

suite('proto.save', function () {
	test('Should create a document', function (done) {
		var params = {
			username: "DaFunix",
			age: 20,
			email: "dafunix@gmail.com"
		};
		database.save(params, function (err, res) {
			should.not.exist(err);
			should.exist(res);
			res.username.should.eql(params.username);
			res.age.should.eql(params.age);
			res.email.should.eql(params.email);
			should.exist(res.id);
			_results.push(res);
			done();
		});
	});
});

suite('proto.update', function () {
	test('Should update a document', function (done) {
		var params = _results[0];
		params.updated = true;
		database.save(params, function (err, res) {
			should.not.exist(err);
			should.exist(res);
			res.updated.should.eql(params.updated);
			res.age.should.eql(params.age);
			res.email.should.eql(params.email);
			res.username.should.eql(params.username);
			should.exist(res.id);
			res.id.should.eql(params.id);
			done();
		});
	});
});

suite('proto.get', function () {
	test('Should not get an invalid document', function (done) {
		database.get('oeiuiozuer', function (err, res) {
			should.exist(err);
			should.not.exist(res);
			done();
		});
	});
	test('Should get a document', function (done) {
		database.get(_results[0].id, function (err, res) {
			should.not.exist(err);
			should.exist(res);
			res.updated.should.eql(_results[0].updated);
			res.age.should.eql(_results[0].age);
			res.email.should.eql(_results[0].email);
			res.username.should.eql(_results[0].username);
			should.exist(res.id);
			res.id.should.eql(_results[0].id);
			done();
		});
	});
});

suite('proto.delete', function () {
	test('Should not delete an invalid document', function (done) {
		database.delete('TEoUITIEe', function (err, res) {
			should.exist(err);
			should.not.exist(res);
			done();
		});
	});
	test('Should delete a document', function (done) {
		database.delete(_results[0].id, function (err, res) {
			should.not.exist(err);
			should.exist(res);
			done();
		});
	});
});

suite('proto.find', function () {
	suite('Dependencies', function () {
		var number = OPTIONS.docsToInsert;
		for (var i = 0; i < number; ++i) {
			(function (i) {
				test('Should create a document [' + i + ']', function (done) {
					var params = {
						username: tester.generate.name() + tester.generate.lastName(),
						age: tester.generate.integer(13, 20),
						email: tester.generate.email(),
						valid: tester.generate.boolean()
					};
					database.save(params, function (err, res) {
						should.not.exist(err);
						should.exist(res);
						done();
					});
				});
			})(i);
		}
	});
	suite('Execution', function () {
		test('Should find all documents with count', function (done) {
			database.find({}, { count: true }, function (err, res) {
				should.not.exist(err);
				should.exist(res);
				res.count.should.eql(OPTIONS.docsToInsert);
				res.limit.should.eql(OPTIONS.defaultLimit);
				res.start.should.eql(OPTIONS.defaultStart);
				res.hits.length.should.eql(res.limit);
				done();
			});
		});
		test('Should find all documents without count', function (done) {
			database.find({}, { count: false }, function (err, res) {
				should.not.exist(err);
				should.exist(res);
				res.limit.should.eql(OPTIONS.defaultLimit);
				res.start.should.eql(OPTIONS.defaultStart);
				res.hits.length.should.eql(res.limit);
				done();
			});
		});
		test('Should find all documents without options', function (done) {
			database.find({}, function (err, res) {
				should.not.exist(err);
				should.exist(res);
				res.limit.should.eql(OPTIONS.defaultLimit);
				res.start.should.eql(OPTIONS.defaultStart);
				res.hits.length.should.eql(res.limit);
				done();
			});
		});
		test('Should find all documents with limit 120', function (done) {
			database.find({}, {limit: 120}, function (err, res) {
				should.not.exist(err);
				should.exist(res);
				res.limit.should.eql(OPTIONS.docsToInsert);
				res.start.should.eql(OPTIONS.defaultStart);
				res.hits.length.should.eql(res.limit);
				done();
			});
		});
		test('Should find all documents with limit 10 && start 10', function (done) {
			database.find({}, {limit: 10, start: 10}, function (err, res) {
				should.not.exist(err);
				should.exist(res);
				res.limit.should.eql(10);
				res.start.should.eql(10);
				res.hits.length.should.eql(res.limit);
				done();
			});
		});
		test('Should find all documents with valid === true', function (done) {
			database.find({ valid: true }, { count: true, limit: 120 }, function (err, res) {
				should.not.exist(err);
				should.exist(res);
				for (var i in res.hits) {
					res.hits[i].valid.should.be.true;
				}
				done();
			});
		});
	});
});