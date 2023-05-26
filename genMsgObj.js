const mongoose = require('mongoose'); //not sure i need this
const Message = require('./schemas/Message');

async function generateAndStoreMsg(username, content, room){
    const newMsg = await Message.create({
        sender: username,
        content: content,
        chatroom: room,
    });
    //the date is generated automatically. 
    return newMsg;
}

module.exports = generateAndStoreMsg;