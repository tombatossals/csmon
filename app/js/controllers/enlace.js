(function () {
   "use strict";
}());

function EnlaceController($scope, $location, $http) {

    $scope.location = $location;
    $scope.subscribed = false;
    $scope.bandwidth = 10;
    $scope.subscriptionText = "Not subscribed";
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

    $scope.clickedSubscription = function() {
        if ($scope.subscribed) {
            $scope.changeSubscription(false);
        } else {
            $scope.openSubscriptionModal();
        }
    }

    $scope.changeSubscription = function(subscription) {
        var bandwidth = $scope.bandwidth;
        $http.put("/api/enlace/" + $scope.enlace._id + "/subscription", { subscription: subscription, bandwidth: bandwidth }).success(function(response) {
            $scope.subscribeShouldBeOpen = false;
            if (subscription) {
                $scope.subscriptionText = "Subscribed (" + $scope.bandwidth + "Mbits limit)";
                $scope.subscribed = true;
            } else {
                $scope.subscriptionText = "Not subscribed";
                $scope.subscribed = false;
            }
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
                if (response.enlace.subscriptions[0].bandwidth !== undefined) {
                    $scope.bandwidth = response.enlace.subscriptions[0].bandwidth;
                }
                $scope.subscriptionText = "Subscribed (" + $scope.bandwidth + "Mbits limit)";
            }
            $scope.graph_image_url = "/graph/" + response.s1.name + "/" + response.s2.name;
            $scope.graph_image_url_weekly = $scope.graph_image_url + "?interval=weekly";
            $scope.graph_image_url_monthly = $scope.graph_image_url + "?interval=monthly";
            $scope.graph_image_url_year = $scope.graph_image_url + "?interval=year";
            $scope.title = "Enlace " + s1 + " - " + s2 + " (" + response.enlace.distance + "km.)";
        });
    }

    $scope.removeLink = function(s1, s2) {
        $http.delete("/api/enlace/" + $scope.enlace._id).success(function(response) {
            window.location = "/";
        });
    };

    $scope.openSubscriptionModal = function() {
        $scope.subscribeShouldBeOpen = true;
    };

    $scope.openDeleteModal = function() {
        $scope.deleteShouldBeOpen = true;
    };

    $scope.cancel = function() {
        $scope.close();
        $scope.subscribed = false;
    };

    $scope.close = function() {
        $scope.deleteShouldBeOpen = false;
        $scope.subscribeShouldBeOpen = false;
    };
}
