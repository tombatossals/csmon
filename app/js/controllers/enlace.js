(function () {
   "use strict";
}());

function EnlaceController($scope, $location, $http) {

    $scope.location = $location;
    $scope.messageOk = false;
    $scope.$watch("location.path()", function() {
        if ($location.path()) {
            var supernodos = $location.path().replace("/", "").split("/");
            if (supernodos.length !== 2) {
                return;
            }
            var s1 = supernodos[0];
            var s2 = supernodos[1];
            goto(s1, s2);
        }
    });

    $http.get("/api/supernodos/search").success(function(response) {
        $scope.searchItems = response;
    });

    $scope.$watch("goto", function(nv, ov) {
        if (nv) {
            window.location = "/supernodo/#/" + nv;
        }
    });

    angular.extend($scope, {
        center: {
                lat: 40.000531,
                lng: -0.039139
        },
        zoom: 16,
        markers: [],
        links: [],
        showLinks: false,
        newmarker: false
    });

    $scope.changeSubscription = function() {
console.log("change");
        var subscribed = $scope.subscribed;
        $http.put("/api/enlace/" + $scope.enlace._id + "/subscription", { subscription: !subscribed }).success(function(response) {
            $scope.subscription = !subscribed;
            $scope.messageOk = true;
        });
    }

    function goto(s1, s2) {
        $http.get("/api/enlace/" + s1 + "/" + s2).success(function(response) {
            $scope.center = response.s1.latlng;
            $scope.markers = [ response.s1, response.s2 ];
            $scope.links = [ response.enlace ];

            $scope.enlace = response.enlace;
            $scope.hash = s1 + "/" + s2;
            $scope.s1 = response.s1;
            $scope.s2 = response.s2;
            if (response.enlace.subscriptions && response.enlace.subscriptions.length > 0) {
                $scope.subscribed = true;
            }
            $scope.graph_image_url = "/graph/" + response.s1.name + "/" + response.s2.name;
            $scope.graph_image_url_weekly = $scope.graph_image_url + "?interval=weekly";
            $scope.graph_image_url_monthly = $scope.graph_image_url + "?interval=monthly";
            $scope.graph_image_url_year = $scope.graph_image_url + "?interval=year";
            $scope.title = "Enlace " + s1 + " - " + s2 + " (" + response.enlace.distance + "km.)";
        });
    }

    $scope.saveUser = function() {
        $scope.messageOk = false;
        $http.put("/api/user/", { phone: $scope.phone }).success(function(response) {
            $scope.messageOk = true;
        });
    };

    $scope.removeLink = function(s1, s2) {
        $http.delete("/api/enlace/" + $scope.enlace._id).success(function(response) {
            window.location = "/";
        });
    };

    $scope.openModal = function() {
        $scope.shouldBeOpen = true;
    };

    $scope.close = function() {
        $scope.shouldBeOpen = false;
    };
}
