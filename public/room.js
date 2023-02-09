const socket = io('/');
const container = document.querySelector('#chat');
const form = document.querySelector('#message');
const text = document.querySelector('#message-box');
let player = new Audio();
console.log(roomId);
socket.emit('join-room',roomId);

const appendDialog = (message,position)=>
{
    const div = document.createElement('div');
    div.classList.add('message-dialog');
    div.innerText = message;
    if(position === 'left')
    div.classList.add('message-left');
    else
    div.classList.add('message-right');
    if(position !== 'left')
    {
        player = new Audio('noti.wav');
        player.play();
    }
    container.append(div);
   
}

appendDialog(`Room id: ${roomId}`,'left');
form.addEventListener('submit',(e)=>{
    e.preventDefault();
    socket.emit('send',text.value);
    appendDialog(`You: ${text.value}`,'left');
    text.value = '';
}
)

socket.emit('new-user',username);

socket.on('user-connected',(message,position)=>
{
    appendDialog(message,position);
});

socket.on('receive',(message,position)=>
{
    
    appendDialog(message,position);
});

socket.on('leave',(message,position)=>
{
  appendDialog(message,position);
})



