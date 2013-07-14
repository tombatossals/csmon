"use strict";

var Supernodo = require('../../common/models/supernodo'),
    Enlace    = require('../../common/models/enlace'),
    findByIp  = require('../../common/common').findByIp,
    User      = require('../../common/models/user'),
    fs        = require('fs'),
    mikrotik_traceroute = require('../../common/mikrotik').traceroute,
    openwrt_traceroute = require('../../common/openwrt').traceroute,
    ensureAuthenticated = require('../../common/google_auth').ensureAuthenticated,
    checkAuthenticated = require('../../common/google_auth').checkAuthenticated;

module.exports = function(app, urls) {

    app.get(urls.api.supernodoSearch, function(req, res) {
        var q = req.query.q;
        var query= {};
        if (q) {
            query = { name: new RegExp("^" + q, "i") };
        }
        Supernodo.find(query, function(err, supernodos) {
            if (err) {
                throw err;
            } else {
                var names = new Array();
                for (var i in supernodos) {
                    names.push({ id: supernodos[i].name, text: supernodos[i].name });
                }
                return res.json(names);
            }
        });
    });

    app.post(urls.api.supernodo, ensureAuthenticated, function(req, res) {
        var lat = req.body.latitude;
        var lng = req.body.longitude;
        var supernodo = new Supernodo();
        supernodo.latlng.lat = lat;
        supernodo.latlng.lng = lng;
        supernodo.name = "newsupernodo";
        supernodo.save(function(err) {
            if (err) {
                throw err;
            } else {
                res.send(200);
            }
        });
    });

    app.post(urls.api.enlace, ensureAuthenticated, function(req, res) {
        var s1 = req.body.s1;
        var s2 = req.body.s2;

        Supernodo.find({ name: { "$in" : [ s1, s2] } }, function(err, supernodos) {
            var s1 = supernodos[0];
            var s2 = supernodos[1];
            var enlace = new Enlace();
            enlace.supernodos = [ { id: s1._id.toString() }, { id: s2._id.toString() } ];
            enlace.save(function() {
                res.send(200);
            });
        });
    });

    app.get(urls.api.clientesBySupernodoName, function(req, res) {
        var name = req.params.name;
        var query = new Object();
	query["name"] = name;

        Supernodo.findOne(query, function(err, supernodo) {
            if (err) {
                throw err;
            } else if (!supernodo.omnitik) {
                res.send(500);
            } else {
                var files = fs.readdir("/var/lib/collectd/" + supernodo.mainip + "/routeros/", function(err, files) {
                    var clients = [];
                    for (var i in files) {
                        var file = files[i];
                        if (file.match("^snr-wlan[0-9]-")) {
                            clients.push(file.split("-")[2].split(".")[0]);
                        }
                    }
                    res.send(clients);
                });
            }
        });
    });

    app.get(urls.api.supernodoByName, function(req, res) {
        var name = req.params.name;
        var query = new Object();
	query["name"] = name;

        Supernodo.findOne(query, function(err, supernodo) {
            if (err) {
                throw err;
            } else {
                delete supernodo["username"];
                delete supernodo["password"];
                var s = new Object();
                var fields = [ "_id", "mainip", "name", "system", "latlng", "omnitik" ];
                for (var i in fields) {
                    var f = fields[i];
                    s[f] = supernodo[f];
                }
                return res.json(s);
            }
        });
    });

    app.put(urls.api.supernodoById, ensureAuthenticated, function(req, res) {
        var id = req.params.id;
        var name = req.body.name;
        var mainip = req.body.mainip;

        Supernodo.findOne({ _id: id }, function(err, supernodo) {
            if (err) {
                throw err;
            } else {
                supernodo.name = name;
                supernodo.mainip = mainip;
                supernodo.save(function(err) {
                    if (err) {
                        throw err;
                    } else {
                        return res.send(200);
                    }
                });
            }
        });
    });

    app.delete(urls.api.supernodoById, ensureAuthenticated, function(req, res) {
        var id = req.params.id;

        Supernodo.findOne({ _id: id }, function(err, supernodo) {
            if (err) {
                throw err;
            } else {
                supernodo.remove();
                return res.send(200);
            }
        });
    });

    app.get(urls.api.supernodo, function(req, res) {
        var query = new Object();
	//query["geometry"] = { $exists: true };

        Supernodo.find(query, function(err, supernodos) {
            if (err) {
                throw err;
            }
            return res.json(supernodos);
        });
    });

    app.put(urls.api.user, ensureAuthenticated, function(req, res) {
        var phone = req.body.phone;
        var pushover = req.body.pushover;

        var query = new Object();
        query["email"] = req.user.email;

        User.findOne(query, function(err, user) {
            if (err) throw err;
            user.phone = phone;
            user.pushover = pushover;
            user.save(function() {
                return res.json(user);
            });
        });
    });

    app.get(urls.api.user, ensureAuthenticated, function(req, res) {
        var query = new Object();
        query["email"] = req.user.email;

        User.findOne(query, function(err, user) {
            if (err) throw err;
            return res.json(user);
        });
    });

    app.get(urls.api.neighbours, function(req, res) {
        var id = req.params.id;
        Enlace.find({ "supernodos.id": { $in: [ id ] } }, function(err, enlaces ) {
            if (err) {
                throw err;
            } else {
                var neighbours = Array();
                for (var i in enlaces) {
                    var enlace = enlaces[i];
                    var supernodos = enlace["supernodos"];
                    if (supernodos[0].id == id) {
                        neighbours.push(supernodos[1].id);
                    } else {
                        neighbours.push(supernodos[0].id);
                    }
                }
                Supernodo.find( { _id: { $in: neighbours } }, function( err, supernodos) {
                    res.send({ supernodos: supernodos });
                });
            }
        });
    });

    app.get(urls.api.path, function(req, res) {
        var s1 = req.params.s1;
        var s2 = req.params.s2;
        Supernodo.find({ name: { $in: [ s1, s2 ] } }, function(err, supernodos) {

            if (!supernodos || supernodos.length != 2) {
                throw new Error("Link not found");
            } else {
                var s1 = supernodos[0];
                var s2 = supernodos[1];
                var traceroute = undefined;
                if (s1.system == "mikrotik") {
                    traceroute = mikrotik_traceroute;
                } else {
                    traceroute = openwrt_traceroute;
                }

                traceroute(s1.mainip, s1.username, s1.password, s2.mainip, function(path) {
                    console.log(path);
                    var count = path.count;
                    var eips = [];
                    eips.push([ s1.mainip, path[0] ]);
                    for (var i = 0; i < path.length - 1; i++) {
                        eips.push([path[i], path[i + 1]]);
                    }
                    var enlaces = [];
                    var count = eips.length;

                    Supernodo.find(function(err, supernodos) {
                        eips.forEach(function(ippair) {
                            var p1 = findByIp(ippair[0], supernodos);
                            var p2 = findByIp(ippair[1], supernodos);
                            if (p1 === null || p2 === null) {
                                res.send(404);
                            } else {
                                var s = [p1.id, p2.id];
                                Enlace.findOne({
                                    "supernodos.id": {
                                        "$all": s
                                    }
                                }, function(err, enlace) {
                                    count = count - 1;
                                    enlaces.push(enlace);
                                    if (count == 0) {
                                        c.enlaces = enlaces;
                                        res.send(enlaces);
                                    }
                                });
                            }
                        });
                    });
                });
            }
        });
    });

    app.get(urls.api.enlaceBySupernodos, checkAuthenticated, function(req, res) {
        var s1 = req.params.s1;
        var s2 = req.params.s2;
        var email = "";
        if (req.user && req.user.email && req.user.email.length > 0) {
            email = req.user.email[0];
        }

        Supernodo.find({ name: { $in: [ s1, s2 ] } }, function(err, supernodos) {

            if (!supernodos || supernodos.length != 2) {
                throw new Error("Link not found");
            } else {
                var s1 = supernodos[0];
                var s2 = supernodos[1];
                Enlace.findOne({ "supernodos.id": { $all: [ s1.id, s2.id ] } }, function(err, enlace) {
                    var subscribed = false;
                    var subscriptions = enlace["subscriptions"];
                    for (var i = 0; i < subscriptions.length; i++) {
                        var e = subscriptions[i];
                        if (e.email === email) {
                            subscribed = true;
                        }
                    }
                    enlace["subscriptions"] = [];
                    if (subscribed) {
                        enlace["subscriptions"].push({ email: email });
                    }
                    res.send({ enlace: enlace, s1: s1, s2: s2 });
                });
            }
        });
    });

    app.put(urls.api.enlaceByIdSubscription, ensureAuthenticated, function(req, res) {
        var subscription = req.body.subscription;
        var email = req.user.email[0];
        var id = req.params.id;
        Enlace.findOne({ _id: id }, function(err, enlace) {
            enlace.subscriptions = [];
            if (subscription) {
                enlace.subscriptions.push({ email: email });
            }
            enlace.save(function(err) {
                if (err) {
                    throw err;
                } else {
                    res.send(200);
                }
            });
        });
    });

    app.put(urls.api.enlaceById, ensureAuthenticated, function(req, res) {
        var id = req.params.id;
        var distance = req.body.distance;

        Enlace.findOne({ _id: id }, function(err, enlace) {
            enlace.distance = distance;
            enlace.save(function(err) {
                if (err) {
                    throw err;
                } else {
                    res.send(200);
                }
            });
        });
    });

    app.delete(urls.api.enlaceById, ensureAuthenticated, function(req, res) {
        var id = req.params.id;
        Enlace.findOne({ _id: id }, function(err, enlace) {
            enlace.remove(function() {
                res.send(200);
            });
        });
    });

    app.get(urls.api.enlace, function(req, res) {
        var query = new Object();
	query["active"] = true;
	//query["geometry"] = { $exists: true };

        Enlace.find(query, function(err, enlaces) {
            if (err) {
                throw err;
            }

            return res.json(enlaces);
        });
    });
};
