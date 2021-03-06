"use strict";

var exec = require('child_process').exec,
    util = require("util"),
    Supernodo = require("../../common/models/supernodo"),
    Enlace = require("../../common/models/enlace"),
    fs = require("fs"),
    ensureAuthenticated = require('../../common/google_auth').ensureAuthenticated;

module.exports = function(app, urls) {

    if (urls.base !== "/") {
        app.get("/", function(req, res) {
            res.redirect(urls.base);
        });
    }

    app.get(urls.user, ensureAuthenticated, function(req, res) {
	var title = "User account management";
	res.render("user", {
            controller: "UserController",
            user: req.user,
            title: title
        });
    });

    app.get(urls.base, function(req, res) {
	var title = "Troncal de la plana";
	res.render("map", {
            controller: "MapController",
            user: req.user,
            title: title
        });
    });

    app.get(urls.supernodo, function(req, res) {
	var title = "Troncal de la plana";
        res.render("supernodo", {
            controller: "SupernodoController",
            user: req.user,
            title: title
        });
    });

    app.get(urls.enlace, function(req, res) {
        var title = "Troncal de la plana";
        res.render("enlace", {
            controller: "EnlaceController",
            user: req.user,
            title: title
        });
    });

    app.get(urls.graphCliente, function(req, res) {

        var supernodo = req.params.supernodo;
        var cliente = req.params.cliente;
        var interval = req.query.interval;

        Supernodo.findOne({ "name": supernodo }, function(err, s) {
            var files = fs.readdirSync("/var/lib/collectd/" + s.mainip + "/routeros/");
            var a = undefined;

            for (var i in files) {
                var file = files[i];
                if (file.match("if_octets-wlan[0-9]-" + cliente + ".rrd")) {
                    a = "/var/lib/collectd/" + s.mainip + "/routeros/" + file;
                    break;
                }
            }

            if (!fs.existsSync(a)) {
                res.send(404);
                return;
            }

            var step = 3600*24;
            var start = -604800*4;

            var command = '/usr/bin/rrdtool graph - --imgformat=PNG ' +
                          '--start=' + start + ' --end=now ' +
                          '--title="Traffic of "' + cliente + ' ' +
                          '--step=' + step + ' --base=1000 --height=140 --width=480 ' +
                          '--alt-autoscale-max --lower-limit="0" ' +
                          '--vertical-label="Tráfico por día (Mbytes)" --font TITLE:10: ' +
                          '--font AXIS:7: --font LEGEND:8: --font UNIT:7: ' +
                          'DEF:a="' + a + '":"tx":AVERAGE:step=1200 ' +
                          'DEF:b="' + a + '":"rx":AVERAGE:step=1200 ' +
                          'AREA:a#4444FFFF:"Bandwidth TX"  ' +
                          'LINE:a#000000FF GPRINT:a:LAST:"Last%8.2lf %s" ' +
                          'GPRINT:a:AVERAGE:"Avg%8.2lf %s"  ' +
                          'GPRINT:a:MAX:"Max%8.2lf %s" GPRINT:a:MIN:"Min%8.2lf %s\\n"  ' +
                          'AREA:b#FF8800FF:"Traffic   RX" LINE:b#000000FF ' +
                          'GPRINT:b:LAST:"Last%8.2lf %s" GPRINT:b:AVERAGE:"Avg%8.2lf %s"  ' +
                          'GPRINT:b:MAX:"Max%8.2lf %s" GPRINT:b:MIN:"Min%8.2lf %s\\n"';

            exec(command, { encoding: 'binary', maxBuffer: 5000*1024 }, function(error, stdout, stderr) {
                res.type('png');
                res.send(new Buffer(stdout, 'binary'));
            });
        });
    });

    app.get(urls.graphPing, function(req, res) {

        var supernodo = req.params.supernodo;
        var interval = req.query.interval;

        Supernodo.findOne({ "name": supernodo }, function(err, s) {
            var a = "/var/lib/collectd/localhost.localdomain/ping/ping-" + s.mainip + ".rrd";
            if (!fs.existsSync(a)) {
                res.send(404);
                return;
            }

            var start = -86400;
            var step = 1200;
            if (interval == "weekly") {
                start = -604800;
                step = 3600*2;
            } else if (interval == "monthly") {
                start = -18144000;
                step = 3600*24;
            } else if (interval == "year") {
                start = -31536000;
                step = 3600*24*7;
            }

            var command = '/usr/bin/rrdtool graph - --imgformat=PNG ' +
                          '--start=' + start + ' --end=now ' +
                          '--title="' + supernodo + ' - Ping to Castalia" ' +
                          '--step=' + step + ' --base=1000 --height=140 --width=480 ' +
                          '--alt-autoscale-max --lower-limit="0" ' +
                          '--vertical-label="ms" --font TITLE:10: ' +
                          '--font AXIS:7: --font LEGEND:8: --font UNIT:7: ' +
                          'DEF:ptime=' + a + ':value:AVERAGE LINE:ptime#6188AB:"Pingtime"';

            exec(command, { encoding: 'binary', maxBuffer: 5000*1024 }, function(error, stdout, stderr) {
                res.type('png');
                res.send(new Buffer(stdout, 'binary'));
            });
        });
    });

    app.get(urls.graphUsers, function(req, res) {

        var supernodo = req.params.supernodo;
        var interval = req.query.interval;

        Supernodo.findOne({ "name": supernodo }, function(err, s) {
            var a = "/var/lib/collectd/" + supernodo + "/node/connected_users.rrd";
            if (!fs.existsSync(a)) {
                res.send(404);
                return;
            }

            var start = -86400;
            var step = 1200;
            if (interval == "weekly") {
                start = -604800;
                step = 3600*2;
            } else if (interval == "monthly") {
                start = -18144000;
                step = 3600*24;
            } else if (interval == "year") {
                start = -31536000;
                step = 3600*24*7;
            }

            var command = '/usr/bin/rrdtool graph - --imgformat=PNG ' +
                          '--start=' + start + ' --end=now ' +
                          '--title="' + supernodo + ' - Connected users" ' +
                          '--step=' + step + ' --base=1000 --height=140 --width=480 ' +
                          '--alt-autoscale-max --lower-limit="0" ' +
                          '--vertical-label="bits per second" --font TITLE:10: ' +
                          '--font AXIS:7: --font LEGEND:8: --font UNIT:7: ' +
                          'DEF:a="' + a + '":"good":MAX:step=1200 ' +
                          'DEF:b="' + a + '":"bad":MAX:step=1200 ' +
                          'AREA:b#EA644A:"Connected users (bad signal)": ' +
                          'LINE:b#CC3118 ' +
                          'GPRINT:b:LAST:"Last %.0lf" ' +
                          'GPRINT:b:MAX:"Max %.0lf" ' +
                          'GPRINT:b:MIN:"Min %.0lf\\n" ' +
                          'AREA:a#54EC48:"Connected users (good signal)":STACK  ' +
                          'GPRINT:a:LAST:"Last %.0lf" ' +
                          'GPRINT:a:MAX:"Max %.0lf" ' +
                          'GPRINT:a:MIN:"Min %.0lf\\n"';

            exec(command, { encoding: 'binary', maxBuffer: 5000*1024 }, function(error, stdout, stderr) {
                res.type('png');
                res.send(new Buffer(stdout, 'binary'));
            });
        });
    });

    app.get(urls.graph, function(req, res) {

        var o = req.params.s1;
        var d = req.params.s2;
        var interval = req.query.interval;

        Supernodo.find({ "name": { "$in": [ o, d ] } }, function(err, supernodos) {
            if (err) {
                throw err;
            } else if (supernodos.length != 2) {
                throw err;
            } else {
                var s1 = supernodos[0];
                var s2 = supernodos[1];

                Enlace.findOne( { "supernodos.id": { "$all": [ s1._id.toString(), s2._id.toString() ] } }, function(err, enlace) {
                    if (err) {
                        throw err;
                    } else {
                        var a = "/var/lib/collectd/" + s1.name + "/links/bandwidth-" + s2.name + ".rrd";
                        var iface = "";

                        if (fs.existsSync(a)) {
                            if (s1._id == enlace.supernodos[0].id) {
                              iface = enlace.supernodos[0].iface;
                            } else {
                              iface = enlace.supernodos[1].iface;
                            }
                            iface = iface.replace(/:[0-9]+\./, ".");
                            var b = "/var/lib/collectd/" + s1.name + "/snmp/if_octets-" + iface + ".rrd";
                        } else {
                            var a = "/var/lib/collectd/" + s2.name + "/links/bandwidth-" + s1.name + ".rrd";
                            if (s2._id == enlace.supernodos[1].id) {
                              iface = enlace.supernodos[1].iface;
                            } else {
                              iface = enlace.supernodos[0].iface;
                            }
                            iface = iface.replace(/:[0-9]+/, "");
                            var b = "/var/lib/collectd/" + s2.name + "/snmp/if_octets-" + iface + ".rrd";
                        }

                        if (!fs.existsSync(a) || !fs.existsSync(b)) {
                            res.send(404);
                            return;
                        }

                        var start = -86400;
                        var step = 60;
                        if (interval == "weekly") {
                            start = -604800;
                            step = 3600*2;
                        } else if (interval == "monthly") {
                            start = -18144000;
                            step = 3600*24;
                        } else if (interval == "year") {
                            start = -31536000;
                            step = 3600*24*7;
                        }

                        var command = '/usr/bin/rrdtool graph - --imgformat=PNG ' +
                                      '--start=' + start + ' --end=now ' +
                                      '--title="' + o + '- ' + d + ' - Bandwidth meter" ' +
                                      '--step=' + step + ' --base=1000 --height=140 --width=480 ' +
                                      '--alt-autoscale-max --lower-limit="0" ' +
                                      '--vertical-label="bits per second" --font TITLE:10: ' +
                                      '--font AXIS:7: --font LEGEND:8: --font UNIT:7: ' +
                                      'DEF:a="' + a + '":"rx":AVERAGE:step=1200 ' +
                                      'DEF:b="' + a + '":"tx":AVERAGE:step=1200 ' +
                                      'DEF:c="' + b + '":"rx":AVERAGE:step=60 ' +
                                      'DEF:d="' + b + '":"tx":AVERAGE:step=60 ' +
                                      'CDEF:cdefb=b,-1,* CDEF:cinbits=c,8,* ' +
                                      'CDEF:cdeff=d,8,* CDEF:dinbits=cdeff,-1,* ' +
                                      'AREA:a#4444FFFF:"Bandwidth TX"  ' +
                                      'LINE:a#000000FF GPRINT:a:LAST:"Last%8.2lf %s" ' +
                                      'GPRINT:a:AVERAGE:"Avg%8.2lf %s"  ' +
                                      'GPRINT:a:MAX:"Max%8.2lf %s" GPRINT:a:MIN:"Min%8.2lf %s\\n"  ' +
                                      'AREA:cinbits#FF0000FF:"Traffic   TX" LINE:cinbits#000000FF ' +
                                      'GPRINT:cinbits:LAST:"Last%8.2lf %s" GPRINT:cinbits:AVERAGE:"Avg%8.2lf %s"  ' +
                                      'GPRINT:cinbits:MAX:"Max%8.2lf %s" GPRINT:cinbits:MIN:"Min%8.2lf %s\\n" ' +
                                      'AREA:cdefb#44AAFFFF:"Bandwidth RX" LINE:cdefb#110000FF ' +
                                      'GPRINT:b:LAST:"Last%8.2lf %s" GPRINT:b:AVERAGE:"Avg%8.2lf %s"  ' +
                                      'GPRINT:b:MAX:"Max%8.2lf %s" GPRINT:b:MIN:"Min%8.2lf %s\\n"  ' +
                                      'AREA:dinbits#FF8800FF:"Traffic   RX" LINE:dinbits#000000FF ' +
                                      'GPRINT:cdeff:LAST:"Last%8.2lf %s" GPRINT:cdeff:AVERAGE:"Avg%8.2lf %s"  ' +
                                      'GPRINT:cdeff:MAX:"Max%8.2lf %s" GPRINT:cdeff:MIN:"Min%8.2lf %s\\n"';

                        exec(command, { encoding: 'binary', maxBuffer: 5000*1024 }, function(error, stdout, stderr) {
                            res.type('png');
                            res.send(new Buffer(stdout, 'binary'));
                        });
                    }
                });
            }
        });
    });
};
