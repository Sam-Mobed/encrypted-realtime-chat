const express = require('express');
const router = express.Router();
const Users = require('../schemas/User');
const createRouter = require('./createRoom');
const Chatroom = require('../schemas/Chatroom');

//I guess i need these? logically they should only be on server.js but w/o them here it might not work.
router.use(express.json({ limit: "100mb"}));
router.use(express.urlencoded({extended:false}));
router.use("/:username/createRoom", createRouter); //to handle requests at that endpoint somewhere else.

router.get('/:username', async (req,res) => {
    try {
        const user = await Users.findOne({ username: req.params.username}).exec(); //since we use findOne instead of find, shouldn't return an array here
        //not sure whether these are passed properly
        const chatrooms = user.chatrooms; //will i be to properly access the fields of chatroom inside ejs?
        const requests = user.requests; //both of these are arrays
        const url = `http://localhost:3000/users/${req.params.username}`; //used twice, make sure it works for both in ejs view

        res.status(200).render('../views/userpage.ejs', { chatrooms: chatrooms, requests: requests, url: url});
    } catch (e) {
        res.status(500).send("Server side error");
    }
}).post(async (req,res) => {
    //the user enters the name and password of a server to try and join
    //how to accept requests?
    const chatroom = await Chatroom.findOne({ name: req.body.name}).exec();
    if (chatroom.password===req.body.password){
        const user = await Users.findOne({ username: req.params.username}).exec(); 
        chatroom.members.push(user); //am i properly pushing a reference to the database, and not something else?
        chatroom.save(); //could be in a try catch but wtv. 
        res.status(200).send('User added to the chatroom.'); //this should either be a redirect or a success pop up
    }else{
        res.status(400).send('Wrong password.');
    }

}).delete(async (req,res) => {
    //if a user wants to leave a chatroom, check how youtube video does it. 
});
//and then we would have /:username/CreateChatRoom
//and also /:username/:chatRoom
//don't think we'll need query parameters here. 

module.exports = router;