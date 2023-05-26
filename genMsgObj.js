const mongoose = require('mongoose'); //not sure i need this
const Message = require('./schemas/Message');

async function generateAndStoreMsg(username, content){
    const newMsg = await Message.create({
        sender: username,
        content: content,
    });
    //the date is generated automatically. 
    return newMsg;
}

module.exports = generateAndStoreMsg;