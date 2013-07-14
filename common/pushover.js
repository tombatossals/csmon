var push = require( 'pushover-notifications' ),
    settings = require("../config/settings"),
    User = require('./models/user');


function sendpush(email, message, title, cb) {
    User.findOne({ email: [ email ]}, function( err, user) {
        var p = new push( {
            user: user.pushover,
            token: settings.PUSHOVER_APPKEY
        });

        var msg = {
            message: message,
            title: title
        };

        p.send(msg, function(err, result) {
            if (err) {
                throw err;
            } else {
console.log(result);
                cb(message);
            }
        });
    });
}

module.exports.sendpush = sendpush;
