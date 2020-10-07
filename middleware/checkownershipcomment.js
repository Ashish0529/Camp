const Comment = require("../models/comment");
const checkOwnershipComment = function(req, res, next){
	
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id,function(err, comment){
		if(err){
			console.log(err);
			req.flash("error","Comment Not Found!")
			res.redirect("back");
		}
		else{
			// does user own the campground
			if(comment.author.id.equals(req.user._id)){
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
	// does user own comment
	//otherwise, redirect
	// if not redirect
}

module.exports = checkOwnershipComment
