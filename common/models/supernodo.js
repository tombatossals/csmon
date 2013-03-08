/** User Schema for CrowdNotes **/

var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var SupernodoSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    mainip: {
        type: String
    },
    latlng: {
        lat: Number,
        lng: Number
    },
    interfaces: [ {
        name: String,
        address: String
    }],
    username: {
        type: String
    },
    password: {
        type: String
    },
    omnitik: {
        type: Boolean
    },
    validated: {
        type: Boolean
    },
    system: {
        type: String
    }
});

module.exports = mongoose.model('supernodos', SupernodoSchema);
