const socket = io();
const kyber = require('crystals-kyber');
//properly link this client code with index.ejs
//make sure the symmetric key persists until the user disconnects or closes tab
//am i importing the necessary packages properly?

let ss1; //this will contain the client's copy of the symmetric key
//definitely not secure, but fine for now

socket.emit('establishKey', {}); //notify server that this socket wants to establish secure connection

//deconstruct the publickey field out of the payload
socket.on('publicKey', ({publickey}) => {
    const c_ss = kyber.Encrypt768(pk);
    //now we have the symmetric key, which we keep, and it's encapsulation which we send to server
    ss1=c_ss[1]; 
    socket.emit('encapsulatedKey', {
        cKey : c_ss[1],
    });
});





//when a user lands on index.js for the first time. the crystals kyber symmetric key is generated and will persist
//for the entire session

//to implement the messaging, we need to be able to catch the message that is sent, emit it to the server,
//and then have it sent back so we can add it to the DOM

