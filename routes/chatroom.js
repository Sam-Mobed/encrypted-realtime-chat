const express = require('express');
const router = express.Router({ mergeParams: true}); //should give us access to username and roomSlug 
const Chatroom = require('../schemas/Chatroom');

router.use(express.json({ limit: "100mb"})); //once again not sure why these are necessary inside any other file but server.js
router.use(express.urlencoded({extended:false}));

router.get('/', async (req,res) => {
    try{
        const chatroomSlug = req.params.roomSlug;
        const chatroom = await Chatroom.findOne({ slug: chatroomSlug }).populate('logs').exec(); //will return an array to us
        //the array's first element should be the oldest message, and last element should be newest message
        //but just selecting the logs is not enough, because it's an array of message id's
        //we need to populate the array with the actual message objects (content, sender, sentAt)
        const url = `http://localhost:3000/users/${req.params.username}`; //for a 'leave' button that will let the user exit chat

        res.status(200).render('../views/chatroom.ejs', { logs: chatroom.logs, roomName: chatroom.name, url: url});
    } catch (err) {
        res.status(500).send("Server side error: " + e);
    }
});

module.exports = router;