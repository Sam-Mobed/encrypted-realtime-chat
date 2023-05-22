const express = require("express");
const router = express.Router();

router.get("/", (req,res) => {
    try {
        res.status(200).render('../views/signup');
    } catch (e) {
        res.status(500).send("Server side error");
    }
});

module.exports = router;

//const mongoose

//connect to mongoose, catch error, try again

