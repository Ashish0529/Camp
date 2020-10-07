const router                    =require('express').Router();
const passport                  = require("passport");
const LocalStrategy             = require("passport-local");
const passportLocalMongoose     = require("passport-local-mongoose");
const Campground                = require("../models/campground");
const Comment                   = require("../models/comment");
const User                      = require("../models/user");
const isLoggedIn                = require("../middleware/isLoggedIn");
const checkOwnershipCampground  = require("../middleware/checkownership");
const checkOwnershipComment     = require("../middleware/checkownershipcomment");



// show register form
router.get("/register",function(req,res){
	res.render("register",{currentUser: req.user});
});



router.post("/register",function(req,res){
	User.register({username: req.body.username,age:req.body.age}, req.body.password,function(err, user){
		console.log(user);
		if(err){
			console.log(err);
			wrong = true;
			req.flash("error",err.message);
			 res.redirect("/register");
			return;
		}
		passport.authenticate("local")(req,res,function(){
			console.log(user);
			req.flash("success","Welcome to YelpCamp "+user.username);
			res.redirect("/campgrounds");
		});
	});
});

router.get("/login",function(req,res){
	res.render("login",{currentUser: req.user});
});

router.post("/login",passport.authenticate("local",{
		 successRedirect: "/campgrounds",
		 failureRedirect: "/login",
	     failureFlash: 'Invalid username or password.'
		 }),function(req, res){
	
});



router.get("/logout",function(req,res){
	req.logout();
		req.flash("success","Successfully Logged Out!");
	res.redirect("/campgrounds");
});

module.exports = router;