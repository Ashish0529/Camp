const Campground = require("../models/campground");

const checkOwnershipCampground = function(req,res ,next){
	// if user logged in?
	if(req.isAuthenticated()){
		Campground.findById(req.params.id,function(err, camp){
		if(err){
			console.log(err);
			req.flash("error","Campground Not Found!")
			res.redirect("back");
		}
		else{
			// does user own the campground
			if(camp.author.id.equals(req.user._id)){
				next();
				
			}else{
				req.flash("error","You don't have permission to do that!  :( ");
				res.redirect("back");
			}
		}
	});
		
	}else{
		req.flash("error","You need to be logged in!");
	res.redirect("back");
	}
}

module.exports = checkOwnershipCampground;