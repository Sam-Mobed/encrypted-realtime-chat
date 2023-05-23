const express = require("express");
const router = express.Router({ mergeParams: true}); //mergeParams should give me access to :username from the parent router
const checkPassword = require('./SignUp');
const Chatroom = require('../schemas/Chatroom');

router.use(express.json({ limit: "100mb"})); //once again not sure why these are necessary inside any other file but server.js
router.use(express.urlencoded({extended:false}));

//once the user successfully creates the chatroom, store what's needed in the database and redirect his ass to the chatroom.
router.get('/', async (req,res) => {
    try{
        const url = `http://localhost:3000/users/${req.params.username}`; //for the form action
        res.status(200).render('../views/create.ejs', {url: url});
    } catch (e) {
        res.status(500).send("Server side error");
    }
}).post(async (req,res) => {

    //we check the password that was submitted
    if (!checkPassword(req.body.password)){
        res.status(400).send('Password does not meet requirements');
        return;
    }

    const invited = req.body.invited; //this is a string, where each username is separated by a space
    const invitedParsed = invited.split(/\s+/); //split the string into an array of usernames.
    //invited isn't a required field, so user doesn't need to send requests at the beginning.

    const requestArray = []; 
    //we need to make a request schema for every user in invitedParsed and pass it to chatroom
    //we use a for...of.. loop instead of forEach, because forOf supports await keyword
    //i think this will cause problems
    for (const user of invitedParsed) {
        let newRequest = await Request.create({
            from: req.body.name,
            recipient: user,
        });
        requestArray.push(newRequest);
    }
    //am I properly storing the reference to a user? 
    const newRoom = await Chatroom.create({
        name: req.body.name,
        password: req.body.password,
        sentRequests: requestArray,
        members: [req.params.username],
        admin: req.params.username,
    });

    //now we send text, but we should be redirecting the user to the new room
    res.status(200).res('Room created successfully.');
});

module.exports = router;