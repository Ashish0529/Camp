require('dotenv').config();
const router                    =require('express').Router();
const Campground                = require("../models/campground");
const Comment                   = require("../models/comment");
const User                      = require("../models/user");
const cloudinary                =  require('cloudinary').v2;
const isLoggedIn                = require("../middleware/isLoggedIn");
const checkOwnershipCampground  = require("../middleware/checkownership");
const checkOwnershipComment     = require("../middleware/checkownershipcomment");


var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})


cloudinary.config({ 
  cloud_name: process.env.cloud_name, 
  api_key: process.env.api_key, 
  api_secret: process.env.api_secret
});


router.get("/campgrounds",function(req,res){	
	Campground.find({},function(err, allCampgrounds){
		if(err)
			{
                console.log(err);
                return;
			}
		else{
			res.render("campgrounds/index", {campgrounds:allCampgrounds});
		}
	});
});


router.post("/campgrounds",isLoggedIn,upload.single('image'), function(req,res){
       cloudinary.uploader.upload(req.file.path, function(err,result) {
       req.body.campground.image = result.secure_url;

       req.body.campground.author = {
       id: req.user._id,
       username: req.user.username
  }
	Campground.create(req.body.campground,function(err, newlyCreated){
		if(err)
			{
				console.log(err);
			    req.flash('error', err.message);
                return res.redirect('back');
			}
		else{
		 //redirect
			req.flash("success","Campground Added Successfully!");
            res.redirect("/campgrounds");
		}
	});
 });
});

router.get("/campgrounds/new",isLoggedIn, function(req,res) {
    res.render("campgrounds/new",{currentUser: req.user});
});


router.get("/campgrounds/:id", function(req,res){
	Campground.findById(req.params.id).populate("comments").exec( function(err, foundCampground){
		if(err)
			{
				console.log(err);
			}
		else{
			console.log(foundCampground.comments);
			res.render("campgrounds/show",{campground:foundCampground , currentUser: req.user});
		}
	});	
});

router.get("/campgrounds/:id/comments/new",isLoggedIn, function(req,res){
	Campground.findById(req.params.id,function(err,camp){
		if(err){
			console.log(err);
		}
		else{
			res.render("comments/new",{campground: camp, currentUser: req.user});
		}
	});
});


router.post("/campgrounds/:id/comment",isLoggedIn, function(req,res){
	// lookup campground using id
	Campground.findById(req.params.id,function(err,camp){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		}
		else{
			console.log(req.body.comment);
			Comment.create(req.body.comment, function(err,comment){
				if(err){
			console.log(err);
				}
				else{
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					//save comment
					comment.save();
					
					camp.comments.push(comment);
					camp.save();
					console.log(comment);
					req.flash("success","Comment Added Successfully!");
					res.redirect('/campgrounds/'+ camp._id);
				}
			});
		}
	})
	
});


router.get("/campgrounds/:id/edit",checkOwnershipCampground,function(req,res){
	
    Campground.findById(req.params.id,function(err, camp){
        res.render("campgrounds/edit",{ campground : camp});
    });
});


router.put("/campgrounds/:id",checkOwnershipCampground,function(req,res){
Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updated){
    if(err){
        res.redirect("/campgrounds");
    }
    else{
        req.flash("success","Successfully Updated Campground!");
        res.redirect("/campgrounds/" + req.params.id);
    }
});
});

router.delete("/campgrounds/:id",checkOwnershipCampground,function(req,res){
Campground.findByIdAndRemove(req.params.id, function(err,camp){
    if(err){
        res.redirect("/campgrounds");
    }
    else{
        req.flash("success","Campground Deleted Successfully!");
        res.redirect("/campgrounds");
    }
});
});


router.get("/campgrounds/:id/comments/:comment_id/edit",checkOwnershipComment,function(req, res){
Comment.findById(req.params.comment_id, function(err, comment){
    
    if(err){
        res.redirect("back");
    }
    else{
        res.render("comments/edit",{currentUser: req.user, campground_id: req.params.id, comment: comment});
    }
});
});

router.put("/campgrounds/:id/comments/:comment_id",checkOwnershipComment,function(req, res){
Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updated){
    if(err){
        res.redirect("/campgrounds");
    }
    else{
        req.flash("success","Comment Updated Successfully!");
        res.redirect("/campgrounds/"+req.params.id);
    }
});

});

router.delete("/campgrounds/:id/comments/:comment_id",checkOwnershipComment,function(req, res){

Comment.findByIdAndRemove(req.params.comment_id, function(err,comment){
    if(err){
        res.redirect("back");
    } else{
        req.flash("success","Comment Deleted Successfully!");
        res.redirect("/campgrounds/"+req.params.id);
    }

});
});


module.exports = router;