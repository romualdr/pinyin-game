angular.module('game')
.factory('ApiService', ['$http', '$rootScope', function ($http, $rootScope) {
	var ROOT = "/api/";
	var exports = {};

	function _process(type, url, params, callback) {
		callback = callback || (function () {});
		$rootScope.$broadcast('API:loading', true);
		return $http[type](ROOT + url, params || undefined)
		.success(function (data, status, headers, config) {
			$rootScope.$broadcast('API:loading', false);
			return callback(null, data);
		})
		.error(function (data, status, headers, config) {
			$rootScope.$broadcast('API:loading', false);
			return callback({ status: status, message: data.message || data });
		});	
	}

	exports.get = function (url, callback) {
		return _process('get', url, undefined, callback);
	};
	exports.post = function (url, params, callback) {
		return _process('post', url, params, callback);
	};
	exports.delete = function (url, callback) {
		return _process('delete', url, undefined, callback);
	};

	return exports;
}]);