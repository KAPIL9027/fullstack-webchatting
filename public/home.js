const joinButton = document.querySelector('#join-btn');
const roomId = document.querySelector('#roomId');

const isValidRoom = (id)=>
{
    for (room in rooms)
    {
        if (room === id)
        return true;
    }
}
joinButton.addEventListener('click',(e)=>
{
 
 const id = roomId.value;
  console.log(rooms);
      joinButton.href = `/${id}`

});