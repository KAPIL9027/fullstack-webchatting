if(process.env.ENV_NODE !== "production")
{
    require('dotenv').config();
}
const express = require('express');
const app = express();
const ExpressError = require('./utils/ExpressError');
const {catchAsync} = require('./utils/catchAsync');
const {userSchema} = require('./schemas.js');
const {v4: uuid} = require('uuid');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const User = require('./models/User');
const session = require('express-session');
const mongoStore = require('connect-mongo');
const passport = require('passport');
const passportLocal = require('passport-local');
const mongoose = require('mongoose');
const flash = require('connect-flash');

const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/webchat';
mongoose.connect(DB_URL);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const secret = process.env.secret;
const store = new mongoStore(
    {
       mongoUrl:DB_URL,
       secret,
    touchAfter: 24 * 60 * 60
    }
);

const sessionConfig = {
store,
name: 'session',
secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};



app.set('view engine','views');
app.set('views',path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({extended: true}));
app.use(flash());
const users = {};
let roooms;

app.use(session(sessionConfig));


const validation = (req,res,next)=>
{
    if(!req.isAuthenticated())
    {
      res.redirect('/login');
    }
    else
    {
        next();
    }
};

const validate = (req,res,next) =>
{
  const {error} = userSchema.validate(req.body);
  if(error)
  {
      const msg = error.details.map( el => el.message).join(',');
      throw new ExpressError(msg,404);
  }
  else
  {
      next();
  }
}
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req,res,next)=>
{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});
app.get('/register',(req,res)=>
{
    res.render('register.ejs');
})
app.post('/register',validate,catchAsync(async (req,res)=>
{
 const {username,password,email} = req.body.user;
 const newUser = new User({
     username,
     email
 });
 const user = await User.register(newUser,password);
 req.login(user,(err)=>
 {
     if (err) return next(err);
     console.log('Successfully logged in');
     res.redirect('/');
 })
}));

app.get('/login',(req,res)=>
{
    res.render('login.ejs');
});

app.post('/login',
passport.authenticate('local', {failureFlash: true,failureRedirect: '/login' }),
(req,res)=>
{
 res.redirect('/');
});

app.get('/logout',(req,res)=>
{
    req.logout();
    res.redirect('/login');
});

app.get('/',(req,res)=>
{
    res.render('home.ejs',{roooms});
})
app.get('/createRoom',validation,(req,res)=>
{
    roomId = uuid();
    res.redirect(`/${roomId}`);
});

app.get('/:roomId',validation,(req,res)=>
{
    res.render('room.ejs',{roomId: req.params.roomId,username: req.user.username});
});

io.on('connection', socket=>
{
    socket.on('join-room',(roomId)=>
    {
        socket.on('new-user',(name)=>
        {
            users[socket.id] = name;
            console.log(`${name} connected!`);
            console.log(roomId);
            socket.join(roomId);
            roooms = socket.rooms;
            socket.broadcast.to(roomId).emit('user-connected',`${name}: joined the room`,'right');
        });
    
        socket.on('send',(message)=>
        {
            socket.broadcast.to(roomId).emit('receive',`${users[socket.id]}: ${message}`,'right');
        })

        socket.on('disconnect',()=>
        {
            socket.broadcast.to(roomId).emit('leave',`${users[socket.id]} left the room`,'right');
        })
    });

   

});

app.all('*',(req,res,next)=>
{
    next(new ExpressError('Page Not Found',404));
})

app.use((err,req,res,next)=>
{
    if(! err.message) err.message = 'Page Not Found!!!';
    res.status(404).send(err.message);
 });

const port = process.env.PORT || 8080;
server.listen(port,()=>
{

    console.log('Server started and listening');
});