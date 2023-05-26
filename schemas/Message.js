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
    content: {
        type: String,
    },
});

module.exports = mongoose.model("Message", messageSchema);