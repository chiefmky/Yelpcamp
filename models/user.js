var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, require: true},
    password: {type: String, require: true},
    avatar: String,
    firstname: {type: String, require: true},
    lastname: {type: String, require: true},
    email: {type: String, unique: true, required: true},
    resetPasswordExpires: String,
    resetPasswordToken: Date,
    isAdmin: {type:Boolean, default: false},
    notifications: [
    	{
    	   type: mongoose.Schema.Types.ObjectId,
    	   ref: 'Notification'
    	}
    ],
    followers: [
    	{
    		type: mongoose.Schema.Types.ObjectId,
    		ref: 'User'
    	}
    ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);