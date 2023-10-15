const mongoose = require('mongoose');

const itemSchema = mongoose.Schema({
    itemName: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
}, {
    timestamps: true
})

module.exports = mongoose.model('Item', itemSchema);