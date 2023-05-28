const socket = io();
const messagesContainer = document.querySelector('.chat-messages');
const userList = document.getElementById('users'); //the container that has the list of active users
const roomName = document.getElementById('room-name');

//the space where user types a message is a form, so we need to retrieve the content
const chatForm = document.getElementById('chat-form');

//since we use route parameters for dynamic routes, and not query strings, one way to access which user sends the msg to which chatroom
//is by breaking down the URL. probably not the best approach, but it will do for now.
const currentUrl = window.location.pathname; // "/users/:username/:chatroom"
const urlParts = currentUrl.split('/'); // ["", "users", "username", "chatroom"]

//get room info and users, userObj contains the array
socket.on('roomUsers', ({ chatroom, users}) => {
    outputUsers(users);
    outputRoomName(chatroom);
});

//once the server receives a message from one of the users, it emits it back to everyone
socket.on('message', message => {
    message.sentAt = new Date(message.sentAt);
    renderMessage(message); //this message should be an object containing date and name of sender, added by server.

    //scroll down every time a new chat is received
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

//user joins the room
socket.emit('joinRoom',  {
        sender: "ChatBot",
        chatroom: urlParts[3],
        user: urlParts[2],
        content: `${urlParts[2]} has joined the room!`,
        sentAt: new Date(),
    }
);

//socket.on('disconnect', () => {
window.addEventListener('beforeunload', () => {
    console.log("user left")
    socket.emit('userLeft', {
        username: urlParts[2],
        chatroom: urlParts[3],
    });
});

//message submit 
chatForm.addEventListener('submit', (event) => {
    event.preventDefault(); // when you submit a form, it automatically submits to a file, we want to stop that from happening 

    //to retrieve the text input by ID
    const msg = {
        sender: urlParts[2],
        chatroom: urlParts[3],
        content: event.target.elements.msg.value,
        sentAt: new Date(),
    };
    
    //we emit the message as the payload to the server
    socket.emit('chatMessage', msg);

    //once we submit the message, we clear the form
    event.target.elements.msg.value = "";
    event.target.elements.msg.focus();
});

//EJS itself does not automatically update the rendered content when the underlying data changes. 
//Once the EJS template is rendered and sent to the client, it becomes static HTML. 
//Therefore, if the underlying array that was used to render the EJS template gets updated on the server-side, 
//the rendered content in the client's browser will not automatically reflect those changes.

//so we need to load the messages inside the logs in the EJS, and for every new message that gets sent we need to
//create a new element dynamically here and add it to the DOM.

//add msg to DOM
function renderMessage(msg){
    //create a div
    const div = document.createElement('div');
    //add class to the div we created
    div.classList.add('message');

    div.innerHTML = `<p class="meta-info"> ${msg.sender} 
    <span style="float: right;">${msg.sentAt.toLocaleDateString(undefined, { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}</span>
    </p>
    <p class="content">${msg.content}</p>`;

    //find the container and add the created div
    messagesContainer.appendChild(div);
}

//again we have to do DOM manipulation to dynamically load the users that are active in the chatroom
//something that can't be done with EJS which becomes static when served to the client
function outputUsers(users){
    //we turn array into a string and outputting it
    userList.innerHTML = `
        ${users.map(user => `<li>${user}</li>`).join('')}
    `;
}

function outputRoomName(name){
    roomName.innerText = name;
}