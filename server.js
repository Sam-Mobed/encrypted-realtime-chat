const express = require("express");
const signupRouter = require('./routes/SignUp');

const app = express();

//first try with the env variable, if for some reason it isn't valid go with 3000
const port = process.env.port || 3000;
//since we are writing all our views with ejs, view engine converts that code to html
app.set('view engine', 'ejs');

//we set a limit on the size of the JSON payload that can be parsed by middleware
//this also makes it so any incoming JSOn request can be parsed and made available in req.body
app.use(express.json({ limit: "100mb"}));

//on index you have the login page.
app.get("/", (req,res) => {
    res.status(200).render('index');
});

app.use('/signup', signupRouter);

//if the user is not in the DB, he has to signup, so he is sent to /signUp

//const loginRouter = require("./routes/login");


//app.use("/api/login", loginRouter);


app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});

//npm run dev: to run with dev, will automatially restart server after each save.
//you can try out the API with postman or Insomnia
//there is also the rest client extension for visual studio code