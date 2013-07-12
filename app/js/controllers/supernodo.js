(function () {
   "use strict";
}());

function SupernodoController($scope, $location, $http) {

    $scope.location = $location;
    $scope.$watch("location.path()", function() {
        if ($location.path()) {
            goto($location.path().replace("/", ""));
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
        newmarker: false,
        goto: false
    });

    function goto(supernodo) {
        $http.get("/api/supernodo/" + supernodo).success(function(response) {
            $scope.supernodo = response;
            $scope.center = response.latlng;
            $scope.markers = [ response ];
            $scope.title = "Supernodo " + response.name + " (" + response.mainip + ")";
            $scope.hash = response.name;

            $scope.graph_ping_url = "/graph/ping/" + response.name;
            $scope.graph_ping_url_weekly = $scope.graph_ping_url + "?interval=weekly";
            $scope.graph_ping_url_monthly = $scope.graph_ping_url + "?interval=monthly";
            $scope.graph_ping_url_year = $scope.graph_ping_url + "?interval=year";

            if (response.omnitik) {
                $scope.graph_image_url = "/graph/users/" + response.name;
                $scope.graph_image_url_weekly = $scope.graph_image_url + "?interval=weekly";
                $scope.graph_image_url_monthly = $scope.graph_image_url + "?interval=monthly";
                $scope.graph_image_url_year = $scope.graph_image_url + "?interval=year";
            }

            $http.get("/api/supernodo/" + response._id + "/neighbours").success(function(response) {
                $scope.supernodos = response.supernodos;
            });

            $http.get("/api/supernodo/" + response.name + "/clients").success(function(response) {
                $scope.clientes = response;
            });
        });
    }

    $scope.saveUser = function() {
        $scope.messageOk = false;
        $http.put("/api/user/", { phone: $scope.phone }).success(function(response) {
            $scope.messageOk = true;
        });
    };

    $scope.removeSupernodo = function(s1, s2) {
        $http.delete("/api/supernodo/" + $scope.supernodo._id).success(function(response) {
            window.location = "/";
        });
    };

    $scope.login = function(url) {
        window.location = "/login?return=" + url + "#" + $location.path();
    };

    $scope.openAddEnlace = function() {
        $scope.isOpenAddEnlace = true;
    };

    $scope.closeAddEnlace = function() {
        $scope.isOpenAddEnlace = false;
    };

    $scope.openRemoveSupernodo = function() {
        $scope.isOpenRemoveSupernodo = true;
    };

    $scope.closeRemoveSupernodo = function() {
        $scope.isOpenRemoveSupernodo = false;
    };

    $scope.saveSupernodo = function() {
        $scope.messageOk = false;
        $http.put("/api/supernodo/" + $scope.supernodo._id, { name: $scope.supernodo.name, mainip: $scope.supernodo.mainip }).success(function(response) {
            $scope.messageOk = true;
        });
    };

    $scope.addEnlace = function() {
        var s2 = $scope.newlink;
        $http.post("/api/enlace/", { s1: $scope.supernodo.name, s2: s2 }).success(function(response) {
            $scope.isOpenAddEnlace = false;
            $http.get("/api/supernodo/" + $scope.supernodo._id + "/neighbours").success(function(response) {
                $scope.supernodos = response.supernodos;
            });
        });
    };
}
