const mongoose = require("mongoose");
const Users = require('./User'); //not sure it's necessary to import when linking references 
const Requests = require('./Request'); //but keep them for now

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
        immutable: true,
    },
    sentAt: {
        type: Date,
        default: new Date(),
        immutable: true,
    },
    content: {
        type: String,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    isUpdated: {
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
    createdAt: {
        type: Date,
        default: new Date(),
    },
    sentRequests: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Requests',
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
//for the request schema, instead of a boolean, should use another data structure to represent sent, declined, accepted
//and if a user already received a request, we can't send another one. 

//I don't need to make custom schema methods. the operations that I want to do:
//clearning requests, adding member, all can be done through mongoose queries.

module.exports = mongoose.model("Chatroom", chatroomSchema);
