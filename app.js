require('dotenv').config();
let express                   = require("express"),
    app                       = express(),
    bodyParser                = require("body-parser"),
    mongoose                  = require("mongoose"),
	flash                     = require("connect-flash"),
	passport                  = require("passport"),
	LocalStrategy             = require("passport-local"),
	passportLocalMongoose     = require("passport-local-mongoose"),
	methodOverride            = require("method-override"),
    Campground                = require("./models/campground"),
	Comment                   = require("./models/comment"),
	User                      = require("./models/user"),
	cookieParser              = require("cookie-parser");
	authRoute                 = require('./routes/auth');
	campgroundRoute           = require("./routes/campground");

const age = 1000*60*60*60;
//process.env.blah
mongoose.connect("mongodb://localhost/camp",{useUnifiedTopology: true, useNewUrlParser: true});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));


app.set("view engine","ejs");

app.use(require("express-session")({
	cookie:{
		maxAge:age
	},
	secret: process.env.secret,
	resave: true,
	saveUninitialized: true
}));

//========= flash message ==========
app.use(flash());


// ============moment js======
app.locals.moment =require("moment");

app.use(cookieParser("secretcode"));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});



app.get("/",function(req,res){
    res.render("campgrounds/landing");
});


//Route Middleware
app.use(authRoute);
app.use(campgroundRoute);

app.listen(process.env.PORT || 5000, function(){
    console.log("Yeah I Am Connected!");

});