require('dotenv').config(); //to load our environment variables.
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); //need to generate a sessionID for user who connects
const kyber = require('crystals-kyber');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); //to parse cookies
const methodOverride = require('method-override');
const http = require('http'); //this is actually used by express under the hood, but we need to use it directly in order to use socket.io 
const path = require('path'); //to remove MIME 
const socketio = require('socket.io');
const Users = require('./schemas/User');
const Chatroom = require('./schemas/Chatroom');
const Message = require('./schemas/Message');
const signupRouter = require('./routes/SignUp');
const userPage = require('./routes/UsersPage');
//const authenticateSocket = require('./middleware/authenticateSocket');
//socketAuthentication needs debugging

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//first try with the env variable, if for some reason it isn't valid go with 3000
const port = process.env.port || 3000;
//since we are writing all our views with ejs, view engine converts that code to html
app.set('view engine', 'ejs');
app.use(cookieParser());
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
app.use('/crystals-kyber', express.static(path.join(__dirname, 'node_modules/crystals-kyber'), {
    setHeaders: (res, path) => {
        res.setHeader('Content-Type', 'text/javascript');
    },
}));
  
app.use('/aes-encryption', express.static(path.join(__dirname, 'node_modules/aes-encryption'), {
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
        //we can't set the JWT yet, because user has to get authorization to the site by logging in, but
        //we need to establish the symmetric key so sensitive info (password) is encrypted before it's sent to the server
        const sessionId = crypto.randomBytes(16).toString('hex');
        res.cookie('sessionID', sessionId); //a unique sessionID for each user who connects to the site
        res.status(200).render('index');
    } catch (e) {
        console.log(e);
        res.status(500).send("Server side error.");
    }
}).post("/", async (req,res) => {
    //lookup user, if he doesnt exist throw error
    //check passwords, if they don't match throw error
    
    const user = await Users.findOne({ username: req.body.username}).exec();

    if (user==null){
        res.status(400).send("No user was found with this username. Try again or sign up.");
    }

    try{
        //important to use .compare to be protected from timing attacks
        //we have to use AES to decrypt req.body.password
        if(await bcrypt.compare(req.body.password, user.password)){
            //generate JWT for user
            const accessToken = jwt.sign({user: req.body.username}, process.env.ACCESS_TOKEN, { expiresIn: "30m"}); //sign is going to first take our payload (what we want to serialize), we also pass the secret key
            //the JWT will be stored as a browser cookie, and to ensure security it is stored as an HTTP-only cookie which cannot be accessed by javascript code and provides some protection
            //again, httpOnly option ensures that the cookie is accessible only by the server and not by JavaScript running on the client-side.
            //this cookie is supposed to be automatically sent back to the server with subsequent requests to the domain name (localhost)
            //we want to put the same user inside of both tokens, so we can easily create a new token from our refresh token
            //we don't put expiration time on refreshTokens, as it is handled 'manually'
            //const refreshToken = jwt.sign(req.body.username, process.env.REFRESH_TOKEN);
            //process.env.REFRESH_TOKEN_val=refreshToken;
            res.cookie('jwt', accessToken, { httpOnly: true });
            res.status(200).redirect(`/users/${req.body.username}`);
        } else {
            res.status(400).send("Wrong Password");
        }
    } catch (e){
        console.log(e);
        res.status(500).send("Server side error.");
    }
});

//io.use(authenticateSocket); //setup middleware, needs debugging so for now comment out
const botName = "ChatBot";
//we use a dictionary to keep trach of all the active chatrooms, and the users in each chatroom
const activeRooms = {};
//run when client connects
const sessionKeys = {};
io.on('connection', socket => {
    //the code below is a little useless, as no one will stay on the index page after logging on, but still
    console.log("New WebSocket Connection.");
    //on connection, we need to socket.emit public key to the client
    //and then client will emit the encapsulation of the symmetric key, and we will then decapsulate it here using our private key
    socket.on('establishKey', ({id}) => {
        const pk_sk = kyber.KeyGen768();
        const sk = pk_sk[1]; //private key for user
        sessionKeys[id] = {privateKey: sk}; 
        socket.emit('publicKey', {
           publickey: pk_sk[0], 
        });
    });

    //this means that the client has generated a symmetric key and is sending us  
    socket.on('encapsulatedKey', ({cKey, id}) => {
        //we decapsulate the key and store it in our dictionary
        const privKey = sessionKeys[id].privateKey;
        const ss2 = kyber.Decrypt768(cKey,privKey);
        sessionKeys[id]['symmetricKey'] = ss2;
        console.log(sessionKeys)
    });
    //socket.on('encapKey')
    socket.on('joinRoom', botMessage => {
        //by default botMessage contains user joined text.
        
        socket.user = botMessage.user; //we store the username as custom data, to be used on disconnect
        socket.room = botMessage.chatroom;
        socket.join(botMessage.chatroom); 
        if(!activeRooms[botMessage.chatroom]){
            activeRooms[botMessage.chatroom] = [];
        }
        activeRooms[botMessage.chatroom].push(botMessage.user);
        
        //welcome the user who connects
        socket.emit('message', {
            sender: botName,
            content: "Welcome to the Chatroom!",
            sentAt: new Date(),
        });
        
        //broadcast when a user connects, this will emit to everybody except the user that got connected
        //broadcast is done to the specific room with to() method 
        socket.broadcast.to(botMessage.chatroom).emit('message', botMessage);

        //send user and room info to the client, so it can be displayed to appropriate room
        io.to(botMessage.chatroom).emit('roomUsers', {
            users: activeRooms[botMessage.chatroom],
            chatroom: botMessage.chatroom,
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

    socket.once('disconnect', () => {
        socket.broadcast.to(socket.room).emit('message', 
        {
            sender: botName,
            content: `${socket.user} has left the room.`,
            sentAt: new Date(),
        }); //first we send a message that a user has disconnected
        //then we remove that username from our list that keeps track of online users
        if (activeRooms[socket.room] && activeRooms[socket.room].length>0){
            const index = activeRooms[socket.room].indexOf(socket.user);
            if (index !== -1) {
                activeRooms[socket.room].splice(index, 1);
            }
            io.to(socket.room).emit('roomUsers', {
                users: activeRooms[socket.room],
                chatroom: socket.room,
            }); //then we update the list that is displayed on the website
        }
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