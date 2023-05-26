const socket = io();
const messagesContainer = document.querySelector('.chat-messages');

//get username and roomSlug from URL
//we will send this info to the server, which will generate the msg object and store it in the DB
//const { username, room } = qs.parse
//WE NEED TO MAKE IT SO WHEN A USER SIGNS IN THE PATH CONTAINS QUERY STRINGS AND NOT DYNAMIC PARAMS?
//OR WE GOOD LIKE THIS?

//the space where user types a message is a form, so we need to retrieve the content
const chatForm = document.getElementById('chat-form');

//once the server receives a message from one of the users, it emits it back to everyone
socket.on('message', message => {
    renderMessage(message); //this message should be an object containing date and name of sender, added by server.

    //scroll down every time a new chat is received
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

//message submit 
chatForm.addEventListener('submit', (event) => {
    event.preventDefault(); // when you submit a form, it automatically submits to a file, we want to stop that from happening 

    //to retrieve the text input by ID
    const msg = event.target.elements.msg.value;

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

    div.innerHTML = `<p class="meta-info" ${msg.sender} <span>${msg.sentAt}</span></p>
    <p class="content">${msg.content}</p>`;

    //find the container and add the created div
    messagesContainer.appendChild(div);
}