angular.module('game')
.controller('HighscoreController', ['$scope', 'ApiService',
	function ($scope, ApiService) {
		$scope.$on('scene:3', function (e, args) {
			$scope.score = args.score;
		});
	}
]);