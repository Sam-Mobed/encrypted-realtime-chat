const mongoose = require("mongoose");

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
    chatroom: {
        type: String,
        required: true,
    },
    content: {
        type: String,
    },
});
//for the chatroom field, it's maybe better to have an ID, but keep it like this for now.
//the corner case is the chatbots sending messages, they don't beling to 
module.exports = mongoose.model("Message", messageSchema);