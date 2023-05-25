const socket = io();

socket.on('message', message => {
    //the welcome message will be printed to the browser's console.
    console.log(message);
});

//no need to actually use sockets here, but i'll keep it. 
//when a user lands on index.js for the first time. the crystals kyber symmetric key is generated and will persist
//for the entire session