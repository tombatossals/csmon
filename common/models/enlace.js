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
    network: {
        type: String
    },
    active: {
        type: Boolean
    },
    supernodos: [{
        id: {
            type: String
        },
        iface: {
            type: String
        }
    }],
});

module.exports.Enlace = mongoose.model('enlaces', EnlaceSchema);
