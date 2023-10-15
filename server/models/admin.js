const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    adminName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    },
    password: {
        type: String,
    },
    authMethod: {
        type: String,
    },
    verification: {
        type: Boolean,
        default: false
    },
    profilePic: {
        url: {
            type: String,
            default: "null"
        },
        id: {
            type: String,
            default: "null"
        }
    },
    role: {
        type: String,
        default: "Admin"
    },
    maintainers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Maintainer'
        }
    ]
}, {
    timestamps: true
})

module.exports = mongoose.model('Admin', adminSchema);