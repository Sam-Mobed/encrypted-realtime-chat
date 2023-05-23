const express = require("express");
const router = express.Router({ mergeParams: true}); //mergeParams should give me access to :username from the parent router

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
    const username = req.params.username; //we have to fetch the user from the database
    //create the chatroom and send the user now admin there.
});

module.exports = router;