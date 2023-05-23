const mongoose = require("mongoose");
const Users = require('./User');

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
    update: {
        type: Boolean,
        default: false,
    },
});

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
        defualt: new Date(),
    },
    sentRequests: [requestSchema],
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

//add schema methods:
//chatroom: remove all sent requests.
chatroomSchema.methods.clearRequests = function(){
    try{
        this.sentRequests=[];
        this.save();
        console.log("Requests have been cleared.");
    }catch (error){
        console.log("Could not clear requests: ", error);
    }
}

module.exports = mongoose.model("Chatroom", chatroomSchema);