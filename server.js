const express = require('express');
const userCollection = require('./schemas/User');
const signupRouter = require('./routes/SignUp');
const { connect, disconnect } = require('./connectDB');
const mongoose = require('mongoose');

const app = express();

//first try with the env variable, if for some reason it isn't valid go with 3000
const port = process.env.port || 3000;
//since we are writing all our views with ejs, view engine converts that code to html
app.set('view engine', 'ejs');
app.use("/signup", signupRouter);
//we set a limit on the size of the JSON payload that can be parsed by middleware
//this also makes it so any incoming JSOn request can be parsed and made available in req.body
app.use(express.json({ limit: "100mb"}));
app.use(express.urlencoded({extended:false})); //this parses URL-encoded data from incoming requests
//NOTE: we have to make sure this doesn't conflict with encryption later

connect().catch(console.dir); //connect to the MongoDB Atlas database

//on index you have the login page.
app.get("/", (req,res) => {
    try {
        res.status(200).render('index');
    } catch (e) {
        res.status(500).send("Server side error");
    }
}).post("/", async (req,res) => {
    //lookup user, if he doesnt exist throw error
    //check passwords, if they don't match throw error
    
    const user = await userCollection.findOne({username: req.body.username});

    if(user.password===req.body.password){
        res.status(200).send("User authorized."); //if it works redirect him to homepage instead
    } else {
        res.status(400).send("Wrong Password");
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});

process.on('SIGINT', disconnect);

//npm run dev: to run with dev, will automatially restart server after each save.
//you can try out the API with postman or Insomnia
//there is also the rest client extension for visual studio code