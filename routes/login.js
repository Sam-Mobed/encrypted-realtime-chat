const express = require("express");
const jwt = require("jsonwebtoken");
//const mongoose

//connect to mongoose, catch error, try again

const router = express.Router();

router.post("/", async (req, res) => {
    //get the users collection from a database and assign it to variable

    //user tries to sign it, sends email and password in req.body
    //password should obviously be hashed -> but this is up to the client code, i'm just doing API not my concern

});