/** User Schema for CrowdNotes **/

var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var EnlaceSchema = new Schema({
    distance: {
        type: String
    },
    saturation: {
        type: String
    },
    bandwidth: {
        type: String
    },
    network: {
        type: String
    },
    active: {
        type: Boolean
    },

    subscriptions : [{
        bandwidth: {
            type: Number
        },
        email: {
            type: String
        }
    }],

    supernodos: [{
        id: {
            type: String
        },
        name: {
            type: String
        },
        iface: {
            type: String
        }
    }],
});

module.exports = mongoose.model('enlaces', EnlaceSchema);
