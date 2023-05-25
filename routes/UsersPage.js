const express = require('express');
const router = express.Router();
const createRouter = require('./createRoom');
const chatroomRouter = require('./chatroom');
const Users = require('../schemas/User');
const Chatroom = require('../schemas/Chatroom');
const Requests = require('../schemas/Request');

//I guess i need these? logically they should only be on server.js but w/o them here it might not work.
router.use(express.json({ limit: "100mb"}));
router.use(express.urlencoded({extended:false}));
router.use("/:username/createRoom", createRouter); //to handle requests at that endpoint somewhere else.
router.use("/:username/:roomSlug", chatroomRouter);

router.get('/:username', async (req,res) => {
    try {
        const user = await Users.findOne({ username: req.params.username}).exec(); //since we use findOne instead of find, shouldn't return an array here
        //not sure whether these are passed properly
        const chatrooms = user.chatrooms; //will i be to properly access the fields of chatroom inside ejs?
        const requests = user.requests; //both of these are arrays
        const url = `http://localhost:3000/users/${req.params.username}`; //used twice, make sure it works for both in ejs view
        
        //need the chatroom name, createdAt and admin
        //we need to add slugs to chatrooms so when we go to that url it's not the ugly id in the url.

        let roomArray=[];
        if (chatrooms.length!==0){
            roomArray = await Chatroom.find({ _id: { $in: chatrooms } }).exec();
        }

        let populatedRequests=[]; //this will populate the reference area of From with actual chatroom object
        if (requests.length!==0){
            populatedRequests = await Requests.find({ _id: { $in: requests } }).populate('from').exec();
        }
        
        res.status(200).render('../views/userpage.ejs', { chatrooms: roomArray, requests: populatedRequests, url: url});
    } catch (e) {
        res.status(500).send("Server side error: " + e);
    }
}).post('/:username', async (req,res) => {
    //the user enters the name and password of a server to try and join
    //how to accept requests?
    const chatroom = await Chatroom.findOne({ name: req.body.roomname}).exec();

    if (chatroom==null) {
        res.status(400).send('No such chatroom');
        return;
    }


    if (chatroom.password===req.body.password){
        const user = await Users.findOne({ username: req.params.username}).select('_id chatrooms').exec(); 
        chatroom.members.push(user._id);
        user.chatrooms.push(chatroom._id);
        
        try{
            await chatroom.save();
            await user.save();
        } catch (error){
            console.log('Failed to save chatroom.');
            res.status(500);
        }

        res.status(200).redirect(`/users/${req.params.username}`);
    }else{
        res.status(400).send('Wrong password.');
    }

});

//when you click on a link, it only does a GET request
//forms only allow POST or GET
//so in order to use delete as a method for our form, we need to use a library called method override
//and it will allow us to do more than just POST/GET

//inside the ejs, you might want to setup the delete with a link element <a> with href, but that's a GET route,
//and when google crawls your site it automatically clicks every single link tags. so if we use this approach
//google will delete all the user's chatrooms each time he goes on that site
router.put('/:username/:id/leave', async (req,res) => {
    //inside the ejs, the delete button must store chatroom.id
    //inside here we will go inside user's chatrooms, and remove the id
    //we will also go inside the chatroom itself, and remove user as one if it's members.
    //we check if the user is also the admin, and remove him from that as well.
    const user = await Users.findOne({ username: req.params.username}).exec();
    user.chatrooms.pull(req.params.id);
    await user.save();
    const chatroom = await Chatroom.findOne({ _id: req.params.id}).select('members admin').exec();
    
    chatroom.members.pull(user._id);

    //admin is an ID
    if (user._id.equals(chatroom.admin)){
        chatroom.admin = undefined; //not good practice but leave it for now.
    }
    await chatroom.save();

    res.status(200).redirect(`/users/${req.params.username}`);
});

//this is likely not the proper way to go about this, but just leave it as is for now
//these definitely need to be in their own files and have their own router.
router.put('/:username/:requestId/accept', async (req,res) => {
    const user = await Users.findOne({ username: req.params.username}).exec();
    user.requests.pull(req.params.requestId);

    const thisrequest = await Requests.findOne({ _id: req.params.requestId}).exec();
    //don't savev yet, we have to add one to chatroom field

    user.chatrooms.push(thisrequest.from);
    await user.save();

    thisrequest.status = true;
    await thisrequest.save();

    const chatroom = await Chatroom.findOne({ _id: thisrequest.from}).select('members').exec();

    chatroom.members.push(user._id);
    await chatroom.save();

    res.status(200).redirect(`/users/${req.params.username}`);
});

router.put('/:username/:requestId/decline', async (req,res) => {
    const user = await Users.findOne({ username: req.params.username}).select('requests').exec();
    user.requests.pull(req.params.requestId);
    await user.save();

    await Requests.findByIdAndDelete(req.params.requestId);

    res.status(200).redirect(`/users/${req.params.username}`);
});

module.exports = router;