angular.module('game')
.factory('RandomService', function () {
	var exports = {};


	exports.getPower = function (nb, base) {
		var pow = 0;
		base = base || 10;
		while (nb >= base) {
			nb = nb / base;
			++pow;
		}
		return pow;
	}

	exports.boolean = function () {
		return ((Math.floor(Math.random() * 1000) % 2) ? true : false);
	};

	exports.integer = function (min, max) {
		min = min || 0;
		max = max || Math.pow(10, (exports.getPower((min < 0 ? -min : min))) || 1);
		var number = min;
		var diff = -min + max - 1;
		var add = Math.floor(Math.random() * Math.pow(10, exports.getPower(max) + 1)) % diff;
		return number + add;
	};

	return exports;
});