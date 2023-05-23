const mongoose = require("mongoose");
const Users = require('./User');

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
    },
    sentAt: {
        type: Date,
        defualt: () => Date.now(),
    },
    content: {
        type: String,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    update: {
        type: Boolean,
        default: false,
    },
});

const chatroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    logs: [messageSchema],
    CreatedAt: {
        type: Date,
        defualt: () => Date.now(),
    },
    sentRequests: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Users',
        }
    ],
    members: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Users',
        }
    ],
    admin: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Users',
    }
});

module.exports = mongoose.model("Chatroom", chatroomSchema);