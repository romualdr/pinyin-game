angular.module('game')
.controller('MainController', ['$scope', 'UserService',
	function ($scope, UserService) {

		/*
			@desc: If API is loading // show loading
		*/
		$scope.isLoading = false;
		$scope.$on('API:loading', function (e, arg) {
			$scope.isLoading = arg;
		});

		/*
			@desc: Scene manager
		*/
		$scope.scene = 999;

		/*
			@desc: Handle user connection // deconnexion
		*/
		$scope.$on('User:connected', function (e, arg) {
			$scope.user = arg;
			$scope.isAdmin = ($scope.user.rank === "admin");
			$scope.scene = 1;
		});
		$scope.$on('User:disconnected', function (e, arg) {
			$scope.$broadcast('Game:end');
			$scope.scene = 0;
			if (arg && arg.message)
				return alert(arg.message);
			else if (arg)
				return alert('An error occured. Please reconnect');
		});


		/*
			@desc: Handle login
		*/
		$scope.username = '';
		$scope.password = '';
		$scope.doLogin = function () {
			UserService.doLogin($scope.username, $scope.password);
		}

		/*
			@desc: Launch scene
		*/
		$scope.launchScene = function (scene, args) {
			$scope.scene = scene;
			$scope.$broadcast('scene:' + scene, args || {});
		};

		// Launch UserService check
		UserService.check();
	}
]);