const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const http = require('http'); //this is actually used by express under the hood, but we need to use it directly in order to use socket.io 
const path = require('path'); //to remove MIME 
const socketio = require('socket.io');
const Users = require('./schemas/User');
const Chatroom = require('./schemas/Chatroom');
const signupRouter = require('./routes/SignUp');
const userPage = require('./routes/UsersPage');
const generateAndStoreMsg = require('./genMsgObj');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//first try with the env variable, if for some reason it isn't valid go with 3000
const port = process.env.port || 3000;
//since we are writing all our views with ejs, view engine converts that code to html
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use("/signup", signupRouter); //what you see below is to remove MIME error, express treated js files inside client as html
app.use('/client', express.static(path.join(__dirname, 'client'), {
    setHeaders: (res, path) => {
      res.setHeader('Content-Type', 'text/javascript');
    },
}));
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

const botName = "ChatBot";
//run when client connects
io.on('connection', socket => {
    //the code below is a little useless, as no one will stay on the index page after logging on, but still.
    console.log("New WebSocket Connection.");

    //broadcast when a user connects, this message should be caught by the client code (will only be sent to the user who is connecting.)
    //socket.emit('message', 'Welcome to the quantum-safe end-to-end encrypted chatroom.')

    //broadcast when a user connects, this will emit to everybody except the user that got connected
    socket.broadcast.emit('message', generateAndStoreMsg(botName, 'A user has joined the chat.'));

    //this would broadcast to everybody, those who are already connected and the user connecting
    //io.emit();

    //runs when client disconnects
    socket.on('disconnect', () => {
        io.emit('message', generateAndStoreMsg(botName, 'A user has left the site.'));
    });

    //listen for chat message
    socket.on('chatMessage', msg => {
        io.emit('message', msg); //but we need to add a date and the name of the sender and send everything back as a JSON
        //const chatroom = await Chatroom.findOne({ username: req.params.name}).select('logs').exec();
        //chatroom.logs.push(msg._id); //since we store by ID
        //here we have to store the message in the database. 
    });
});
/*
WebSocket connections are independent of specific routes in your backend application. 
Once a WebSocket connection is established, it remains active until the client or server explicitly closes it. 
The connection is not tied to any specific route or endpoint.

Therefore, I don't need to repeat this code for different routes in the rest of the app. 
The provided code is sufficient to handle WebSocket connections globally, regardless of the 
routes defined.

The above code handles WebSocket connections throughout your application. 
As long as the server is running and the client establishes a WebSocket connection to the server, 
the code will handle events like client connection, disconnection, and broadcasting messages to connected clients.
*/

server.listen(port, () => {
    console.log(`Server listening on port ${port}...`);
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

/* for html files that need it
<script type="text/javascript" src="/socket.io/socket.io.js"></script>
<script type="text/javascript" src="../client/main.js"></script>
*/