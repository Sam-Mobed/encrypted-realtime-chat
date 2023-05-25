const express = require('express');
const mongoose = require('mongoose');
const Users = require('./schemas/User');
const signupRouter = require('./routes/SignUp');
const userPage = require('./routes/UsersPage');
const methodOverride = require('method-override');

const app = express();

//first try with the env variable, if for some reason it isn't valid go with 3000
const port = process.env.port || 3000;
//since we are writing all our views with ejs, view engine converts that code to html
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use("/signup", signupRouter);
app.use("/users", userPage);
//we set a limit on the size of the JSON payload that can be parsed by middleware
//this also makes it so any incoming JSOn request can be parsed and made available in req.body
app.use(express.json({ limit: "100mb"}));
app.use(express.urlencoded({extended:false})); //this parses URL-encoded data from incoming requests
//NOTE: we have to make sure this doesn't conflict with encryption later.

//connect to MongoDB Atlas Server
mongoose.connect("mongodb+srv://masdebom:secure12pass13@myapps.vcsyakz.mongodb.net/?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then( () => {
    console.log("Connection established to MongoDB Atlas.");
}).catch( () => {
    console.log("Failed to establish connection to the database.");
});

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
    
    const user = await Users.findOne({ username: req.body.username}).exec();
    
    if (user==null){
        res.status(400).send("No user was found with this username. Try again or sign up.");
    }else{
        if(user.password===req.body.password){
            res.status(200).redirect(`/users/${req.body.username}`);
        } else {
            res.status(400).send("Wrong Password");
        }
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});

process.on('SIGINT', () => {
    try{
        mongoose.disconnect();
        console.log("Safely disconnected from the database. Goodbye...");
        process.exit(0);
    } catch (error) {
        console.log("Failed to gracefully disconnect from the database.");
        process.exit(1);
    }
    
}); //close connection with the database once the server shuts down. 

//npm run dev: to run with dev, will automatially restart server after each save.
//you can try out the API with postman or Insomnia
//there is also the rest client extension for visual studio code
//