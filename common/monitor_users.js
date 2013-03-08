#!/usr/bin/env node

process.on('error', function(err) {
    logger.error("Error fatal");
    //mongoose.disconnect();
});

var logger    = require("./log"),
    mongoose  = require('mongoose'),
    Netmask   = require('netmask').Netmask,
    Enlace    = require("./models/enlace").Enlace,
    util      = require("util"),
    sshConn   = require("ssh2"),
    getConnectedUsers = require("./mikrotik").getConnectedUsers,
    readline  = require("readline"),
    Supernodo = require("./models/supernodo");

var working = new Array();

var conn = 'mongodb://localhost/troncales';
var db = mongoose.connect(conn);
var INTERVAL = process.env.COLLECTD_INTERVAL;

if (!INTERVAL) {
	INTERVAL = 1200;
}

function monitor_users(supernodo, countdown_and_exit) {
    getConnectedUsers(supernodo.mainip, supernodo.username, supernodo.password, function(value) {
        console.log(util.format("PUTVAL \"%s/node/connected_users\" interval=%s N:%s", supernodo.name, INTERVAL, value));
        logger.debug(util.format("PUTVAL \"%s/node/connected_users\" interval=%s N:%s", supernodo.name, INTERVAL, value));
        countdown_and_exit(supernodo.id);
    });
}

var query = { system : "mikrotik", omnitik: true };
Supernodo.find(query).exec(function(err, supernodos) {
    if (err) { throw err };

    var counter = supernodos.length;

    var waitfor = new Array();
    for (var i=0; i<supernodos.length; i++) {
        waitfor.push(supernodos[i].id);
    }

    setTimeout(function() {
       logger.error(util.format("Bad exit: %s", waitfor));
       process.exit(-1);
    }, 380000);

    function countdown_and_exit(sid) {
        waitfor.splice(waitfor.indexOf(sid), 1);
        if (waitfor.length == 0) {
            mongoose.disconnect();
            process.exit(0);
        }
    }

    supernodos.forEach(function(supernodo) {
        monitor_users(supernodo, countdown_and_exit);
    });
});

