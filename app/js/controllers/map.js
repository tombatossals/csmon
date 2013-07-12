(function () {
   "use strict";
}());

function MapController($scope, $location, $http) {

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
	markers: [],
	zoom: 13,
        gps: false,
        newmarker: false
    });

    $scope.hash = $location.path();

    $http.get("/api/supernodo/").success(function(response) {
        $scope.markers = response;
    });

    $scope.openModal = function() {
        $scope.shouldBeOpen = true;
    };

    $scope.close = function() {
        $scope.shouldBeOpen = false;
    };

    $scope.addMarker = function() {
        $scope.links = [];
        $scope.markers = [];
        $scope.newmarker = true;
        $scope.gps = false;
        $("#all-links").removeClass("active");
    };

    $scope.postMarker = function() {
        $http.post("/api/supernodo/", $scope.newmarker).success(function(response) {
            $scope.newmarker = false;
            $http.get("/api/supernodo/").success(function(response) {
               $scope.markers = response;
            });
        });
    };

    $scope.updateLinks = function() {
        if ($scope.links.length > 0) {
            for (var e in $scope.links) {
                var enlace = $scope.links[e];
                var distance = parseInt(enlace.distance, 10)/1000;
                $http.put("/api/enlace/" + enlace._id, { distance: distance });
            }
        }
    };

    $scope.$watch("gps", function(nv, ov) {
        $scope.newmarker = false;
        var gps = nv;

        if (!gps) {
            $http.get("/api/enlace/").success(function(response) {
               $scope.links = response;
            });
            $http.get("/api/supernodo/").success(function(response) {
               $scope.markers = response;
            });
        } else {
            $scope.links = [];
        }
    });

    $scope.$watch("path", function(newValue, oldValue) {
        var path = newValue;
        if (!path) return;
        $scope.links = [];
        if (path.length === 2) {
            $http.get("/api/path/" + path[0].name + "/" + path[1].name).success(function(response) {
                $scope.links = response;
            });
        }
    }, true);

}
