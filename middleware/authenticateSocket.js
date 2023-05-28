require('dotenv').config();
const jwt = require('jsonwebtoken');
//as you know inside server.js we use socket.io for the message passing inside the chatroom, since we don't use HTTP
//requests there, we can't use the other authentication function, so we define this new middleware here

function authenticateSocket(socket, next) {
    //since we don't have access to req, we have to breakdown the cookie ourself.
    const token = socket.handshake.headers.cookie
    .split('; ')
    .find((row) => row.startsWith('jwt='))
    .split('=')[1];
  
    if (!token) {
        return next(new Error('Unauthorized'));
    }
  
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) return next(new Error('Forbidden.')); 
        if (socket.user !== user.user) {
            return next(new Error('Unauthorized'));
        }
        
        socket.user = user;
        next();
    });
}

module.exports = authenticateSocket;