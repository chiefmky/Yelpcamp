var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, require: true},
    password: {type: String, require: true},
    avatar: String,
    firstname: {type: String, require: true},
    lastname: {type: String, require: true},
    email: {type: String, unique: true, require: true},
    resetPasswordExpires: String,
    resetPasswordToken: String,
    
    isAdmin: {type:Boolean, default: false}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);