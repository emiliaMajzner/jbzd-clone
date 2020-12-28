const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const Joi = require('joi');
const { render } = require('ejs');
const methodOverride = require('method-override');
const session = require('express-session');
const {memeSchema} = require('./schemas');
const Meme = require('./models/post')
const passport = require('passport');
const LocalStrategy = require('passport-local');
const flash = require('connect-flash');
const User = require('./models/user')
const {isLoggedIn} = require('./middleware')
const catchAsync = require('./utils/catchAsync')
const ExpressError = require('./utils/ExpressError');
const { func } = require('joi');

mongoose.connect('mongodb://localhost:27017/JBZD', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();


app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) =>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req. flash('error');
    next();
})

const validateMeme = (req, res, next) =>{
    const {error} = memeSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg)
    } else {
        next();
    }
}


//Home page, and index page
app.get('/', catchAsync(async (req, res) => {
    const posts = await Meme.find({}).populate('author');
    posts.reverse();
    res.render('home', { posts })
}))
//uploading new posts
app.get('/upload',isLoggedIn, (req, res) => {    
    res.render('upload');    
})
app.post('/upload', isLoggedIn, catchAsync (async (req, res) => {    
    const post = new Meme(req.body);
    post.author = req.user._id;
    post.creationDate =  new Date();
    await post.save();
    req.flash('success', 'made new post');
    res.redirect(`/meme/${post._id}`)
}))
//showing one post
app.get('/meme/:id', catchAsync (async (req, res) => {
    const post = await Meme.findById(req.params.id).populate('author')
    res.render(`meme`, { post})
}))
//registration
app.get('/register', (req, res)=>{
    res.render('register')
})
app.post('/register', catchAsync (async (req, res)=>{
    const {email, username, password} = req.body;
    const user = new User({email, username});
    const registeredUser = await User.register(user, password);
    registeredUser.creationDate =  new Date();
    req.login(registeredUser, err =>{
        if(err) return next(err);
    })
    res.redirect('/');
}))
//login
app.get('/login', (req, res)=>{
    res.render('login')
})
app.post('/login',passport.authenticate('local',{failureFlash: true, failureRedirect: '/login'}), async (req, res)=>{
    res.redirect('/');
})
//logout
app.get('/logout', (req, res)=>{
    req.logout();
    res.redirect('/');
})

//anythin else
app.all('*',(req, res, next)=>{
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next)=>{
    const {statusCode = 500, message = 'Something went wrong '} = err;
    res.status(statusCode).send(message);
})


app.listen(3000, () => {
    console.log('Listening on port 3000')
})