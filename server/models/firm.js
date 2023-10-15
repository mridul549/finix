const mongoose = require('mongoose');

const firmSchema = mongoose.Schema({
    firmName: {
        type: String,
        required: true
    },
    address: {
        type: String
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Firm', firmSchema);