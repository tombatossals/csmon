(function () {
   "use strict";
}());

function UserController($scope, $location, $http) {

    $http.get("/api/user/").success(function(response) {
        $scope.phone = response.phone;
        $scope.pushover = response.pushover;
    });

    $http.get("/api/enlace/subscription/").success(function(response) {
        $scope.subscriptions = response;
    });

    $scope.messageOk = false;

    $scope.unsubscribe = function(id) {
        $http.put("/api/enlace/" + id + "/subscription", { subscription: false }).success(function(response) {

            $http.get("/api/enlace/subscription/").success(function(response) {
                $scope.subscriptions = response;
            });

        });
    };

    $scope.saveUser = function() {
        $scope.messageOk = false;
        $http.put("/api/user/", { phone: $scope.phone, pushover: $scope.pushover }).success(function(response) {
            $scope.messageOk = true;
        });
    };
}
