const mongoose = require("mongoose");
const Chatroom = require('./Chatroom');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    requests: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Chatroom',
        }
    ],
    chatrooms: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Chatroom',
        }
    ],
    accountCreatedAt: {
        type: Date,
        defualt: () => Date.now(),
    },
});
//requests: alternatively, there are no requests, user can join a room with a password. optional: passwords can be whispered. 
//requrests, array of other user's id's
//chatrooms, array of chatroom id's
//chatrooms a list of id's, chatrooms have their own models in their own collection (chatrooms must have a unique name), chatrooms contain message log. 
//although the password should be a hashed 64bit hexadecimal or wtv

module.exports = mongoose.model("Users", userSchema);