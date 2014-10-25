angular.module('game')
.controller('GameController', ['$scope', 'ApiService', 'RandomService', '$timeout',
	function ($scope, ApiService, Random, $timeout) {
		$scope.questions = {
			first: [],
			second: []
		};

		$scope.$on('scene:2', function () {
			// Default values;
			$scope.score = 0;
			$scope._id = null;
			$scope._number = 0;
			$scope.character = null;

			ApiService.get('words')
			.error(function () {
				alert('Unable to contact server');
				$scope.launchScene(1);
			})
			.success(function (data) {
				$scope.words = data.hits;
				$scope.newQuestion();
			});
		});

		$scope.newQuestion = function () {
			++($scope._number);
			if ($scope._number > 10)
				return $scope.launchScene(3, { score: $scope.score });
			$scope.waiting = false;
			$scope.questions['first'] = [];
			$scope.questions['second'] = [];
			$scope.select = [-1,-1, -1, -1];
			$scope.getQuestion();
		};

		$scope.validate = function () {
			if ($scope.waiting)
				return;
			$scope.waiting = true;
			for (var i in $scope.questions.first) {
				if ($scope.character.pinyin === $scope.questions.first[i])
					$scope.select[2] = +i;
			}
			for (var i in $scope.questions.second) {
				if ($scope.character.english === $scope.questions.second[i])
					$scope.select[3] = +i;
			}
			if ($scope.select[2] === $scope.select[0])
				$scope.score += 100;
			if ($scope.select[3] === $scope.select[1])
				$scope.score += 100;
			$timeout($scope.newQuestion, 1500);
		};

		$scope.getQuestion = function () {
			console.log($scope.words.length);
			if ($scope.character)
				$scope.words.push($scope.character);
			$scope._id = Random.integer(0, $scope.words.length);
			$scope.character = $scope.words.splice($scope._id, 1)[0];
			$scope.getProps($scope.questions['first'], 'pinyin', 2);
			$scope.getProps($scope.questions['second'], 'english', 2);
		};

		$scope.getProps = function (arr, key, number) {
			var ids = [];
			var _sol = false;
			for (var i = 0; i <= number; ++i) {
				var pick = null;
				if ((ids.indexOf($scope.character.id) === -1) && (Random.boolean() || number === i)) {
					pick = $scope.character;
				} else {
					pick = $scope.words[Random.integer(0, $scope.words.length)];
				}

				if (ids.indexOf(pick.id) !== -1) {
					--i;
				} else {
					arr.push(pick[key]);
					ids.push(pick.id);
				}
			}
		};

		// Triggered when login failed
		$scope.$on('Game:end', function () {
		});
	}
]);