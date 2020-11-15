var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      min: 6,
      max: 255,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      min: 6,
      max: 255,
    },
    forgetPasswordToken: {
      type: String,
      required: false,
    },
    forgetPasswordExpires: {
      type: Date,
      required: false
    },
    verified: {
      type: Boolean,
      default: false,
    },
    campgrounds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campground",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
