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
const { getToken } 												 = require('../utils/token');



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

router.get("/forgot", function (req, res) {
	req.logOut();
	res.render("forgot");
});	

router.get("/reset", function (req, res) {
	res.render("reset");
});


router.post("/forgot", [body("username").isEmail()], async function(req, res) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			req.flash("error", errors.array());
			return res.redirect("/forgot");
		}

		const user = await User.findOne({ username: req.body.username });
		if (!user) {
			req.flash("error", "User not found");
			return res.redirect("/forgot");
		}

		const forgotPasswordToken = await getToken();
		user.forgetPasswordToken = forgotPasswordToken;
		user.forgetPasswordExpires = Date.now() + 150000; // 15M
		await user.save();

		const protocol = req.protocol;
		const host = req.get('host');
		const message=`<h4 style="text-align:center;color:red;">Welcome to Camp Post</h4>
			<h4 style="color:blue;text-align:center;">To reset your password in Camp Post click the link below</h4>
			<h4 style="text-align:center;color:red;"><a href='${protocol}://${host}/forgot/user/${forgotPasswordToken}'>Reset Password!</h4>`;

		const forgotEmailResponse = verifyEmail(user.username,"Your Camp password reset request",message);

		if (forgotEmailResponse === "failure") {
			throw new Error("Failed to send mail");
		}
		
		req.flash("success", `An email has been sent to your given email id = ${user.username}`);
		req.logout();
		res.redirect("/login");

	} catch(ex) {
		console.error(ex);
	}
});


router.get("/forgot/user/:forgotPasswordToken", async function(req, res) {
	try {
		const userToken = req.params.forgotPasswordToken;
		const user = await User.findOne({
			forgetPasswordToken: userToken, 
			forgetPasswordExpires: { 
				$gt: Date.now() 
			}
		});
		if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('/forgot');
		}

		res.render("reset", {
			currentUser: user,
			resetPasswordLink: `/reset/user/${userToken}`
		});
	} catch(ex) {
		console.error(ex);
	}
});


router.post("/reset/user/:forgotPasswordToken",[body('newpassword').isLength({min: 6}), body('cnfpassword').isLength({min: 6})],async function(req, res) {
	try {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			req.flash("error", errors.array());
			return res.redirect(req.get('referer'));
		}

		const newPassword = req.body.newpassword;
		const cnfPassword = req.body.cnfpassword;


		if (newPassword !== cnfPassword) {
			req.flash("error", "Password does not match");
			return res.redirect(req.get('referer'));
		}

		const userToken = req.params.forgotPasswordToken;
		console.log("Token: ", userToken);
		const user = await User.findOne({
			forgetPasswordToken: userToken, 
			forgetPasswordExpires: { 
				$gt: Date.now() 
			}
		});

		if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('back');
		}

		await user.setPassword(newPassword);
		user.forgetPasswordToken = undefined;
		user.forgetPasswordExpires = undefined;

		await user.save();

		const message=`<h4 style="text-align:center;color:red;">Welcome to Camp Post</h4>
			<h4 style="color:blue;text-align:center;">${user.username} your passwrd got changed</h4>`;

		const changePasswordResponse = verifyEmail(user.username,"Your password got changed",message);


		if (changePasswordResponse === "failure") {
			throw new Error("Failed to send mail");
		}

		req.flash("success", "Password changed successfully");
		res.redirect("/login");

	} catch (ex) {
		console.error(ex);
	}
});

module.exports = router;