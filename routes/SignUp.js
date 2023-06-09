require('dotenv').config();
const express = require("express");
const jwt = require('jsonwebtoken');
const router = express.Router();
const Users = require('../schemas/User');
const bcrypt = require('bcrypt');

router.use(express.json());
router.use(express.urlencoded({ extended: false }));

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
    const existingUser = await Users.find({ username: req.body.username}).exec();

    if (existingUser.length!==0){
        res.status(400).send("Username already exists. Please choose a new one");
    } else {
        const checkPword = checkPassword(req.body.password);
        const checkUname = checkUsername(req.body.username);

        if (!checkUname){
            res.status(400).send("Username did not meet requirements");
        }else if(!checkPword){
            res.status(400).send("Password did not meet requirements");
        }else{
            //the eventListener we added in signup.js should prevent the user from inputing two different passwords
            try{
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                const newUser = await Users.create({
                    username: req.body.username,
                    password: hashedPassword,
                });
                //create JWT
                const accessToken = jwt.sign({user: req.body.username}, process.env.ACCESS_TOKEN, { expiresIn: "30m"});
                res.cookie('jwt', accessToken, { httpOnly: true });
                res.status(200).redirect(`/users/${req.body.username}`);
            } catch (error){
                console.error("Error creating user: ", error); 
                res.status(500).send("Server error occurred");
            }
        }
    }
});
//what we can do is check if username already exists, then we return an error
//once the user has been added to the database, we send him to /userName/chatRooms
//inside that dynamic route, we will check the chatRooms of the new user, which should be empty, so nothing is shown

module.exports = router;

//const mongoose

//connect to mongoose, catch error, try again