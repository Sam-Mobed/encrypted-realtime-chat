const mongoose = require("mongoose");
const Users = require('./User');
const Chatroom = require('./Chatroom');

const requestSchema = new mongoose.Schema({
    from: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Chatroom',
        required: true,
        immutable: true,
    },
    recipient: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Users',
        required: true,
        immutable: true,
    },
    status: {
        type: Boolean,
        default: false,
    },
    issuedAt: {
        type: Date,
        default: new Date(),
    },
});

module.exports = mongoose.model("Requests", requestSchema);