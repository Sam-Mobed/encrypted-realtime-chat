const express = require("express");
const router = express.Router({ mergeParams: true}); //mergeParams should give me access to :username from the parent router
const checkPassword = require('./SignUp');

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
    const name = req.body.name;
    const password = req.body.password;
    const invited = req.body.invited; //this is a string, where each username is separated by a space
    const invitedParsed = invited.split(/\s+/); //split the string into an array of usernames.
    //invited isn't a required field, so user doesn't need to send requests at the beginning.


    const username = req.params.username; 
    
    //we have to fetch the user from the database
    // the admin is also a user
    //create the chatroom and send the user now admin there.
});

module.exports = router;