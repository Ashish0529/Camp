var mongoose = require("mongoose");
var mongoose_fuzzy_searching = require("mongoose-fuzzy-searching");

var campgroundSchema = new mongoose.Schema({
  name: String,
  price: String,
  image: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: String,
    name:String
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  createdAt: {
	type: Date,
	default: Date.now(),
  },
},
{
  timestamps: true,
});

campgroundSchema.plugin(mongoose_fuzzy_searching, { fields: ["name"] });

var Campground = mongoose.model("Campground", campgroundSchema);
module.exports = Campground;
