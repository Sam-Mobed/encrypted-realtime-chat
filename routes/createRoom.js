const express = require("express");
const bcrypt = require('bcrypt');
const router = express.Router({ mergeParams: true}); //mergeParams should give me access to :username from the parent router
const Chatroom = require('../schemas/Chatroom');
const Users = require('../schemas/User');
const Requests = require('../schemas/Request');
const authenticateToken = require('../middleware/authenticateToken');

//this function should be middleware, it's used in multiple files. keep it like this for now.
function checkPassword(password){
    if (password.length<10){
        return false;
    }
    const regex = /(?=.*\d)(?=.*[\W])/; // Lookahead assertions for digit and special character
    return regex.test(password);
}

router.use(express.json({ limit: "100mb"})); //once again not sure why these are necessary inside any other file but server.js
router.use(express.urlencoded({extended:false}));

//once the user successfully creates the chatroom, store what's needed in the database and redirect his ass to the chatroom.
router.get('/', authenticateToken, async (req,res) => {
    try{
        const url = `http://localhost:3000/users/${req.params.username}`; //for the form action
        res.status(200).render('../views/create.ejs', {url: url});
    } catch (e) {
        res.status(500).send("Server side error");
    }
}).post('/', authenticateToken, async (req,res) => {

    //we check the password that was submitted
    if (!checkPassword(req.body.password)){
        res.status(400).send('Password does not meet requirements');
        return;
    }
    const roomNames = await Chatroom.find({ username: req.params.username}).select('name').exec(); //this will return a list of chatroom names
    
    if (roomNames.includes(req.body.name)){
        res.status(400).send('Chatroom name already exists, please select a different one.');
        return;
    }

    const invited = req.body.invited; //this is a string, where each username is separated by a space
    const invitedParsed = invited.split(/\s+/); //split the string into an array of usernames.
    //invited isn't a required field, so user doesn't need to send requests at the beginning.
    
    //we need to make a request schema for every user in invitedParsed and pass it to chatroom
    //we use a for...of.. loop instead of forEach, because forOf supports await keyword
    //i think this will cause problems
    
    //am I properly storing the reference to a user?
    const creator = await Users.findOne({ username: req.params.username}).exec();
    
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newRoom = await Chatroom.create({
        name: req.body.name,
        password: hashedPassword,
        members: [creator._id],
        admin: creator._id,
    });

    if (invitedParsed.length!==0){
        for (const user of invitedParsed) {
            const thisuser = await Users.findOne({ username: user}).exec();
            if (thisuser == null){
                continue; //ignore the fact that user can send requests to non-existing people
            }
            //we can't use newRoom._id yet, as it isn't generated yet, so just use the room's name
            const newRequest = await Requests.create({
                from: newRoom._id,
                recipient: thisuser._id,
            });
            //save each  of these requests inside User's requests
            newRoom.sentRequests.push(newRequest);
            thisuser.requests.push(newRequest);
            await thisuser.save();
        }
    }
    //in a real app we would have to check if the users actually exist, or if multiple requests are sent to the same user 
    await newRoom.save();
    creator.chatrooms.push(newRoom);
    await creator.save();
    //now we send text, but we should be redirecting the user to the new room
    res.status(200).redirect(`http://localhost:3000/users/${req.params.username}`);
});

module.exports = router;

/*
Regarding whether I should put code logic inside middleware functions or directly inside the callback methods:

If the validation logic for the chat room name and password is relatively simple, 
you can handle it directly inside the callback function that handles the POST request. 
This keeps the logic contained within the route handler and allows you to respond to the client immediately 
with an appropriate error message if the validation fails.

However, if the validation logic is more complex or you anticipate reusing it in multiple routes or 
middleware functions, it might be beneficial to create a separate middleware function. 
This can help keep your codebase organized, promote reusability, and allow for easier maintenance. 
The middleware function can be added to the route(s) that require the validation, and it can be responsible 
for checking the uniqueness of the chat room name and the password requirements.

In general, if the validation logic is simple and specific to a particular route, it can be handled directly 
in the route handler. If the validation logic is complex, reusable, or needs to be applied to multiple routes, 
creating a separate middleware function is a good approach. Consider the specific requirements and complexity 
of your validation logic to determine the most appropriate approach for your application.

*/