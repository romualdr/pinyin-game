angular.module('game')
.factory('UserService', ['ApiService', '$rootScope', function (ApiService, $scope) {
	var exports = {};


	exports.user = null;
	exports.check = function () {
		ApiService.get('user', function (err, data) {
			if (err)
				$scope.$broadcast('User:disconnected');
			else
				$scope.$broadcast('User:connected', data);
		});
	}

	exports.doLogin = function (username, password) {
		ApiService.post('user', {
			username: username,
			password: password
		}, function (err, data) {
			if (err)
				return $scope.$broadcast('User:disconnected', err);
			exports.user = data;
			return $scope.$broadcast('User:connected', data);
		});
	}

	return exports;
}]);