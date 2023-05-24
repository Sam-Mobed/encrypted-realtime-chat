const express = require("express");
const router = express.Router({ mergeParams: true}); //mergeParams should give me access to :username from the parent router
const checkPassword = require('./SignUp');
const Chatroom = require('../schemas/Chatroom');
const Users = require('../schemas/User');
const Requests = require('../schemas/Chatroom');

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
}).post('/', async (req,res) => {

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
    
    const requestArray = []; 
    //we need to make a request schema for every user in invitedParsed and pass it to chatroom
    //we use a for...of.. loop instead of forEach, because forOf supports await keyword
    //i think this will cause problems
    
    //am I properly storing the reference to a user?
    const creatorId = await Users.findOne({ username: req.params.username}).select('_id').exec();
    
    const newRoom = await Chatroom.create({
        name: req.body.name,
        password: req.body.password,
        members: [creatorId],
        admin: creatorId,
    });
    
    for (const user of invitedParsed) {
        const userId = await Users.findOne({ username: user}).select('_id').exec();
        const newRequest = await Requests.create({
            from: newRoom._id,
            recipient: userId,
        });
        requestArray.push(newRequest);
    }
    
    //in a real app we would have to check if the users actually exist. 

    await newRoom.sentRequests.set(requestArray);
    await newRoom.save();
    //I'm not sure this is the proper way to save the array.

    //now we send text, but we should be redirecting the user to the new room
    res.status(200).res('Room created successfully.');
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