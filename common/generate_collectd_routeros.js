#!/usr/bin/env node

var logger = require("./log"),
    mongoose = require('mongoose'),
    Supernodo = require("./models/supernodo");

var conn = 'mongodb://localhost/troncales';
var db = mongoose.connect(conn);

Supernodo.find({ system: "mikrotik" }, function(err, supernodos) {
    if (err) { throw err };

    console.log("LoadPlugin \"routeros\"");
    console.log("<Plugin \"routeros\">");

    for (var i=0; i<supernodos.length; i++) {
        var supernodo = supernodos[i];

        console.log("  <Router>");
        console.log("      CollectInterface true");
        console.log("      CollectRegistrationTable true");
        console.log("      CollectCPULoad true");
        console.log("      CollectMemory true");
        console.log("      CollectDF true");
        console.log("      CollectDisk true");
        console.log("      Host \"" + supernodo.mainip + "\"");
        console.log("      User \"" + supernodo.username + "\"");
        console.log("      Password \"" + supernodo.password + "\"");
        console.log("  </Router>");

    }
    console.log("</Plugin>");
    mongoose.disconnect();
});
