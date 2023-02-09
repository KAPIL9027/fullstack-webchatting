
const hmBtn = document.querySelector('.hamburger-btn');
const navLinks = document.querySelector('.nav-links');

hmBtn.addEventListener('click',(e)=>
{
    console.log('clicked');
    navLinks.classList.toggle('active');
});