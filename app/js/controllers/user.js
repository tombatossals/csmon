(function () {
   "use strict";
}());

function UserController($scope, $location, $http) {

    $http.get("/api/user/").success(function(response) {
        $scope.phone = response.phone;
        $scope.pushover = response.pushover;
    });

    $scope.messageOk = false;

    $scope.saveUser = function() {
        $scope.messageOk = false;
        $http.put("/api/user/", { phone: $scope.phone, pushover: $scope.pushover }).success(function(response) {
            $scope.messageOk = true;
        });
    };
}
