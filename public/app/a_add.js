angular.module('game')
.controller('AdminCharacter', ['$scope', 'ApiService',
	function ($scope, ApiService) {

		$scope.$on('scene:5', function () {
			$scope.character = "";
			$scope.pinyin = "";
			$scope.english = "";
		});

		$scope.saveChar = function () {
			ApiService.post('word', {
				character: $scope.character,
				pinyin: $scope.pinyin,
				english: $scope.english,
			})
			.error(function (data) {
				alert(data.message || data);
			})
			.success(function (data) {
				$scope.launchScene(4);
			});
		};
	}
]);