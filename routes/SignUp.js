const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const userCollection = require('../schemas/User');

function checkPassword(password){
    if (password.length<10){
        return false;
    }
    const regex = /(?=.*\d)(?=.*[\W])/; // Lookahead assertions for digit and special character
    return regex.test(password);
}

function checkUsername(username){
    if (username.length<6){
        return false;
    }
    return true;
}

router.get("/", (req,res) => {
    try {
        res.status(200).render('../views/signup');
    } catch (e) {
        res.status(500).send("Server side error");
    }
}).post("/", async (req,res) => {

    const existingUser = await userCollection.findOne({username: req.body.username}); //we can't have this as await

    if (existingUser){
        res.status(400).send("Username already exists. Please choose a new one");
        return;
    }

    const checkPword = checkPassword(req.body.password);
    const checkUname = checkUsername(req.body.username);

    if (!checkUname){
        res.status(400).send("Username did not meet requirements");
        return;
    }else if(!checkPword){
        res.status(400).send("Password did not meet requirements");
        return;
    }

    const newUser = {
        username: req.body.username,
        password: req.body.password,
    };

    //the eventListener we added in signup.js should prevent the user from inputing two different passwords
    try{
        await userCollection.insertMany([newUser]); 
        res.status(200).send("User created successfully."); //instead of send we have to redirect user to his homepage
    } catch (error){
        console.error("Error creating user: ", error); 
        res.status(500).send("Server error occurred");
    }
});
//what we can do is check if username already exists, then we return an error
//once the user has been added to the database, we send him to /userName/chatRooms
//inside that dynamic route, we will check the chatRooms of the new user, which should be empty, so nothing is shown

module.exports = router;

//const mongoose

//connect to mongoose, catch error, try again