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
const { body, validationResult } = require('express-validator');
const verifyEmail                = require('../utils/sendEmail');



// show register form
router.get("/register",function(req,res){
	res.render("register",{currentUser: req.user});
});



router.post("/register",[body('username').isEmail(),body('password').isLength({ min: 6 })], async function(req,res){

	const errors = validationResult(req);
    if (!errors.isEmpty()) {

		req.flash("error",errors.array());
		res.redirect("/register");
		return;
  }
	User.register({username: req.body.username,name:req.body.name}, req.body.password,function(err, user){
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
			let protocol=req.protocol;
			let host = req.get('host');
			let message=`<h4 style="text-align:center;color:red;">Welcome to Camp Post</h4>
			<h4 style="color:blue;text-align:center;">To verify your account in Camp Post click the link below</h4>
			<h4 style="text-align:center;color:red;"><a href='${protocol}://${host}/verify/user/${user._id}'>Verify your account!</h4>`;

            let response = verifyEmail(user.username,"User Verififcation!",message);

            if(response=="failure")
            {
                User.findByIdAndDelete(user._id, function (err, docs) { 
                    if (err){ 
						console.log(err);
						req.flash("error",err.message);
			            res.redirect("/register");
                        return; 
                    } 
                    else{ 
                        console.log("Deleted : ", docs);
                        req.flash("error","There was error with your email id use correct email id or try again later!");
			            res.redirect("/register");
                    } 
                }); 
            }
			req.flash("success","An email has been sent to your given email id = "+user.username+"! Veryify your account and then login again!");
			req.logout();
			res.redirect("/login");
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

//email verification route

router.get("/verify/user/:user_id", async function(req,res){

    const user = await User.findById(req.params.user_id);

    if(!user)
    {
        res.send("<div style='text-align:center;padding-top:40%'><h4>No such user exist</h4></div>");
    }

    if(user.verified==true)
    {
        res.send("<div style='text-align:center;padding-top:40%'><h4>Your account has already been verified!</h4></div>");
    }

    user.verified=true;
    user.save();
	console.log(user);
	let protocol=req.protocol;
	let host = req.get('host');
	let message=`<h3 style="text-align:center;color:red;">Welcome to Camp Post!</h3>
	<h6>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse hendrerit ullamcorper nibh, vel suscipit mauris dapibus quis. Sed et consectetur dui. Nulla sed augue convallis, facilisis tortor nec, gravida enim. Ut ut nulla vitae arcu consequat convallis non at lorem. Sed suscipit sed tellus a tristique. Cras rhoncus lectus lacus. Donec ac tempor neque. Nullam commodo sed dui ut efficitur. Nunc aliquet consequat urna eu interdum. Phasellus nisl ipsum, malesuada a interdum nec, lobortis non erat. Nulla sodales erat non sapien pulvinar, ut dapibus felis eleifend.</h6>
	<h4 style="text-align:center;color:red;"><a href='${protocol}://${host}/campgrounds'>Browse Camps at our websites!</h4>`;

    let response = verifyEmail(user.username,"Welcome Message from Camp Post!",message);
    res.send(`<div style='text-align:center;padding-top:10%'><h4>Your email has been verified. Go and <a href='${protocol}://${host}/login'>Login again!</h4></div>`);
});

module.exports = router;