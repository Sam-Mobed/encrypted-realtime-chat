
//chat.js will handle message passing at a specific route /users/:user/:chatroom
//the message will retrieve text, add date and sender to it, send it to client.
//and then store it along with other fields necessary.


//the index.js file will generate the symmetric key along with AES that will remain valid for the time that the user
//stays logged in.

//login.js will generate the JWT that will remain valid for a time and authenticate the user. (by sending the token
//to the server which will use middleware on it between requests)