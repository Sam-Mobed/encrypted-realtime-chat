const express = require('express');
const router = express.Router();
const Users = require('../schemas/User');

//I guess i need these? logically they should only be on server.js but w/o them here it might not work.
app.use(express.json({ limit: "100mb"}));
app.use(express.urlencoded({extended:false}));

router.get('/:username', async (req,res) => {
    try {
        const user = await Users.findOne({ username: req.params.username}).exec(); //since we use findOne instead of find, shouldn't return an array here

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
}).delete(async (req,res) => {
    //if a user wants to leave a chatroom
});
//and then we would have /:username/CreateChatRoom
//and also /:username/:chatRoom
//don't think we'll need query parameters here. 

module.exports = router;