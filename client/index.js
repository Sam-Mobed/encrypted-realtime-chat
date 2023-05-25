const socket = io();

//the space where user types a message is a form, so we need to retrieve the content
const chatForm = document.getElementById('chat-form');

//once the server receives a message from one of the users, it emits it back to everyone
socket.on('message', message => {
    //outputMessage(message)
});

//when a user lands on index.js for the first time. the crystals kyber symmetric key is generated and will persist
//for the entire session

//to implement the messaging, we need to be able to catch the message that is sent, emit it to the server,
//and then have it sent back so we can add it to the DOM

//message submit 
chatForm.addEventListener('submit', (event) => {
    event.preventDefault(); // when you submit a form, it automatically submits to a file, we want to stop that from happening 

    //to retrieve the text input by ID
    const msg = event.target.elements.msg.value;

    //we emit the message as the payload to the server
    socket.emit('chatMessage', msg);
});