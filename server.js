const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const http = require('http'); //this is actually used by express under the hood, but we need to use it directly in order to use socket.io 
const path = require('path'); //to remove MIME 
const socketio = require('socket.io');
const Users = require('./schemas/User');
const Chatroom = require('./schemas/Chatroom');
const Message = require('./schemas/Message');
const signupRouter = require('./routes/SignUp');
const userPage = require('./routes/UsersPage');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//first try with the env variable, if for some reason it isn't valid go with 3000
const port = process.env.port || 3000;
//since we are writing all our views with ejs, view engine converts that code to html
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use("/signup", signupRouter); //what you see below is to remove MIME error, express treated js files inside client as html
app.use(express.static(__dirname + '/views/styles'));
app.use('/styles', express.static(path.join(__dirname, 'views', 'styles'), {
    setHeaders: (res, path) => {
      res.setHeader('Content-Type', 'text/css');
    },
})); //setup static file servers
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
    //the code below is a little useless, as no one will stay on the index page after logging on, but still
    console.log("New WebSocket Connection.");
    
    //how do we keep track of this for each room, can we keep it here?
    activeChatters=[]; //everytime someone joins a room, we push to this, everytime someone leaves, we pull from it
    //data and computation done inside io.on(...) is isolated to each individual socket connection
    //therefore by putting the array here, it should be only accessed by a single socket.
    socket.on('joinRoom', botMessage => {
        //by default botMessage contains user joined text.
        
        socket.join(botMessage.user); //is this enough?
        activeChatters.push(botMessage.user);

        //welcome the user who connects
        socket.emit('message', {
            sender: "ChatBot",
            content: "Welcome to the Chatroom!",
            date: new Date(),
        });
        
        //broadcast when a user connects, this will emit to everybody except the user that got connected
        //broadcast is done to the specific room with to() method 
        socket.broadcast.to(botMessage.chatroom).emit('message', botMessage);

        //send user and room info to the client, so it can be displayed to appropriate room
        io.to(botMessage.chatroom).emit('roomUsers', {
            users: activeChatters,
        });
    });

    //this would broadcast to everybody, those who are already connected and the user connecting
    //io.emit();

    //listen for chat message, message is JSON with three fields of sender, content and chatroom
    socket.on('chatMessage', async msg => {
        //we have the content, the sender and the chatroom
        const newMsg = await Message.create({
            sender: msg.sender,
            content: msg.content,
            chatroom: msg.chatroom,
            sentAt: msg.sentAt,
        });
        io.to(msg.chatroom).emit('message', newMsg); //we send the message back before continuing to not waste time.
        //the date will be generated by default and sent back to client
        
        //now store the message in the logs, so old messages can be rendered for users
        if(newMsg.sender!==botName){
            //remember, the client sees the chatroom slug in the URL, and that's what he sends back to server
            const chatroom = await Chatroom.findOne({slug: newMsg.chatroom}).select('logs').exec();
            chatroom.logs.push(newMsg._id); //since the message is already stored in its collection, we pass its id
            await chatroom.save();
        }
        //here we have to store the message in the database. only store it if it's not coming from chatbot
    });

    //runs when client disconnects
    socket.on('userLeft', ({username,chatroom}) => {
        //note user is just disconnecting here, he is still a member of the room
        socket.broadcast.to(chatroom).emit('message', `${username} has left the chat.`);
        const index = activeChatters.indexOf(username); //remove the user from active chatters. 
        if (index !== -1) {
            activeChatters.splice(index, 1);
        }

        io.to(chatroom).emit('roomUsers', {
            users: activeChatters,
        });
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