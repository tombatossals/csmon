#!/usr/bin/env node

var logger    = require("./log"),
    mongoose  = require('mongoose'),
    Enlace    = require("./models/enlace"),
    exec      = require('child_process').exec,
    fs = require("fs"),
    util      = require("util"),
    Supernodo = require("./models/supernodo");

var working = new Array();

process.setMaxListeners(100);
var conn = 'mongodb://localhost/troncales';
var db = mongoose.connect(conn);
var INTERVAL = process.env.COLLECTD_INTERVAL;

if (!INTERVAL) {
	INTERVAL = 1200;
}

function get_data_from_command_line(enlace, s1, s2, cb) {
   var result = { bandwidth: 0, traffic: 0 };
   var iface = enlace.supernodos[0].iface;

   if (enlace.supernodos[0].id != s1._id) {
       iface = enlace.supernodos[1].iface;
   }

   var f = util.format("/var/lib/collectd/%s/links/bandwidth-%s.rrd", s1.name, s2.name);
   if (!fs.existsSync(f)) {
       f = util.format("/var/lib/collectd/%s/links/bandwidth-%s.rrd", s2.name, s1.name);
   }

   var command = util.format('/usr/bin/rrdtool graph xxx -s $(date -d yesterday +%%s) -e $(date +%%s) DEF:val1=%s:rx:AVERAGE PRINT:val1:LAST:%lf DEF:val2=%s:tx:AVERAGE PRINT:val2:LAST:%lf | tail -2', f, f);

   exec(command, function(error, stdout, stderr) {
       var bandwidth = stdout.trim().split("\n");
       if (bandwidth.length == 2 && bandwidth[0] > 0 && bandwidth[1] > 0) {
           bandwidth = parseInt(bandwidth[0], 10) + parseInt(bandwidth[1], 10);
           result.bandwidth = parseInt(bandwidth/(2*1024*1024), 10);
       } else {
           result.bandwidth = 0;
       }

       var command = util.format('/usr/bin/rrdtool graph xxx -s $(date -d yesterday +%%s) -e $(date +%%s) DEF:val1=/var/lib/collectd/%s/snmp/if_octets-%s.rrd:tx:MAX PRINT:val1:LAST:%lf DEF:val2=/var/lib/collectd/%s/snmp/if_octets-%s.rrd:tx:MAX PRINT:val2:LAST:%lf| tail -2', s1.name, iface, s1.name, iface);
       exec(command, function(error, stdout, stderr) {
           var traffic = stdout.trim().split("\n");
           traffic = parseInt(traffic[0], 10) + parseInt(traffic[1], 10);
           result.traffic = parseInt(traffic*8/(2*1024*1024), 10);
           cb(result);
       });
   });
}

function update_bandwidth_link(enlace, countdown_and_exit) {
    var s1 = enlace.supernodos[0].id;
    var s2 = enlace.supernodos[1].id;

    Supernodo.count({ _id: { $in: [ s1, s2 ] } }, function(err, count) {
        if (count != 2) {
            logger.error(util.format("Invalid link: %s %s %s", enlace.id, s1, s2));
            countdown_and_exit(enlace.id);
        } else {
            Supernodo.find({ _id: { $in: [ s1, s2 ] } }, function(err, supernodos) {
                var s1 = supernodos[0];
                var s2 = supernodos[1];

                get_data_from_command_line(enlace, s1, s2, function(result) {
                    var traffic = result.traffic;
                    var bandwidth = result.bandwidth;
                    var saturation = 3;

                    if (bandwidth) {
                        var percentage = parseInt(traffic*100/bandwidth, 10);
                        if (percentage < 10) {
                            saturation = 0;
                        } else if (percentage < 25) {
                            saturation = 1;
                        } else if (percentage < 50) {
                            saturation = 2;
                        } else {
                            saturation = 3;
                        }
                   }
 
                   enlace.bandwidth = bandwidth;
                   enlace.saturation = saturation;
                   enlace.save(function() {
                       logger.debug(util.format("Updated bandwidth %s-%s: saturation %s, bandwidth %s", s1.name, s2.name, saturation, bandwidth));
                       countdown_and_exit(enlace.id);
                   });
               });
                    
            });
        }
    });
}

var query = { active: true };
Enlace.find(query).exec(function(err, enlaces) {
    if (err) { throw err };

    var counter = enlaces.length;

    var waitfor = new Array();
    for (var i=0; i<enlaces.length; i++) {
        waitfor.push(enlaces[i].id);
    }

    setTimeout(function() {
       logger.error(util.format("Bad exit: %s", waitfor));
       process.exit(-1);
    }, 380000);

    function countdown_and_exit(enlaceid) {
        waitfor.splice(waitfor.indexOf(enlaceid), 1);
        if (waitfor.length == 0) {
            mongoose.disconnect();
            process.exit(0);
        }
    }

    enlaces.forEach(function(enlace) {
        update_bandwidth_link(enlace, countdown_and_exit);
    });
});

