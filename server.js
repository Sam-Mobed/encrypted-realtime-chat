const express = require("express");

const app = express();

//first try with the env variable, if for some reason it isn't valid go with 3000
const port = process.env.port || 3000;

//we set a limit on the size of the JSON payload that can be parsed by middleware
//this also makes it so any incoming JSOn request can be parsed and made available in req.body
app.use(express.json({ limit: "100mb"}));

//how do we force them to authenticate
app.get("/", (req,res) => {
    res.status(200).send("Welcome to secure REST API");
});

const loginRouter = require("./routes/login");


app.use("/api/login", loginRouter);


app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});

//npm run dev: to run with dev, will automatially restart server after each save.
//you can try out the API with postman or Insomnia
//there is also the rest client extension for visual studio code