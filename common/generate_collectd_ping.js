#!/usr/bin/env node

var logger = require("./log"),
    mongoose = require('mongoose'),
    Supernodo = require("./models/supernodo");

var conn = 'mongodb://localhost/troncales';
var db = mongoose.connect(conn);

Supernodo.find(function(err, supernodos) {
    if (err) { throw err };

    console.log("LoadPlugin \"ping\"");
    console.log("<Plugin \"ping\">");

    for (var i=0; i<supernodos.length; i++) {
        var supernodo = supernodos[i];

        console.log("  Host \"" + supernodo.mainip + "\"");

    }
    console.log("</Plugin>");
    mongoose.disconnect();
});
