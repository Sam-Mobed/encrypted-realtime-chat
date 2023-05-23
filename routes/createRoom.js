const express = require("express");
const router = express.Router();

router.use(express.json({ limit: "100mb"})); //once again not sure why these are necessary inside any other file but server.js
router.use(express.urlencoded({extended:false}));

//once the user successfully creates the chatroom, store what's needed in the database and redirect his ass to the chatroom.
router.get('/', async (req,res) => {
    //render the page
}).post(async (req,res) => {
    //create the chatroom and send the user now admin there.
});

module.exports = router;