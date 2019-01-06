var express = require("express"),
    router = express.Router(),
    User = require("../models/user"),
    Campground = require("../models/campground"),
    async = require("async"),
    nodemailer = require("nodemailer"),
    crypto = require("crypto"),
    passport = require("passport");

//Route route
router.get("/", function(req, res){
    res.render("landing");
});

//SIGNUP
//Auth sign up form
router.get("/register", function(req, res) {
    res.render("register", {page: "register"});
})
//handling user sign up
router.post("/register", function(req, res){
    var newUser = new User({
        username:req.body.username,
        firstname:req.body.firstname,
        lastname:req.body.lastname,
        email:req.body.email,
        avatar:req.body.avatar
        
    });
    if(req.body.adminCode ==="Brigitte0903"){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("register",{error:err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " +user.username);
            res.redirect("/campgrounds");
        });
    });
});

//LOGIN
//login form
router.get("/login", function(req, res) {
    res.render("login", {page:"login"});
});
//handling user login up
router.post("/login", passport.authenticate("local", {
    successReturnToOrRedirect:"/campgrounds",
    failureRedirect:"/login",
    failureFlash:true,
    successFlash:"Welcome to YelpCamp"
    }),function(req, res){
});

//Logout
router.get("/logout",function(req, res) {
    req.logout();
    req.flash("success", "You logout");
    res.redirect("/");
});

//FORGOT PASSOWORD
router.get("/forgot",function(req, res) {
    res.render("forgot");
});

router.post("/forgot",function(req, res, next){
    async.waterdall([
        function(done){
           crypto.randomBytes(20,function(err, buf){
               var token = buf.toString("hex");
               done(err, token);
           });
        },
        function(done,token){
            User.findOne({ email:req.body.email }, function(err, user){
                if(!user){
                    req.flash("error","No account with that email address exists.");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; //1 hour
                
                user.save(function(err){
                    done(err, token, user);
                });
            });
        },
        function(token, user, done){
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user:"mosesmokoy@gmail.com",
                    pass:process.env.GMAILPW
                }
            });
            var mailOption = {
                to: user.email,
                from: "mosesmokoy@gmail.com",
                subject:"Node.js password Reset",
                text: "You are receiving this because you (or someone else ) have requested the reset of the password for your account.\n\n" +
                  "Please click on the following link, or paste this into a browser to complete the process:\n\n" + 
                  "http://" + req.headers.host + "/reset" + token +"\n\n" + 
                  "if you did not request this, please ignore this email and your password will remain the unchange.\n"
            };
            smtpTransport.sendMail(mailOption, function(err){
                console.log("Mail sent");
                req.flash("success", "An e-mail has been sent to " + user.email + "with further instructions.");
                done(err, "done");
            });
        }
    ], function(err){
        if(err){
            return next(err);
        }
        res.redirect("/forgot");
    });
});

//RESET PASSWORD($gt means greater than)
router.get("/reset/:token", function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash("error", "Password reset token is invalid or has expired.");
      return res.redirect("/forgot");
    }
    res.render("reset", {token: req.params.token});
  });
});

router.post("/reset/:token", function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash("error", "Password reset token is invalid or has expired.");
          return res.redirect("back");
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect("back");
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: "Gmail", 
        auth: {
          user: "mosesmokoy@gmail.com",
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: "mosesmokoy@gmail.com",
        subject: "Your password has been changed",
        text: "Hello,\n\n" +
          "This is a confirmation that the password for your account " + user.email + " has just been changed.\n"
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash("success", "Success! Your password has been changed.");
        done(err);
      });
    }
  ], function(err) {
    res.redirect("/campgrounds");
  });
});



//USER PROFILE
router.get("/users/:id", function(req, res) {
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error","Something went wrong");
            res.redirect("/");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function(err,campgrounds){
            if(err){
                req.flash("error","Something went wrong");
                res.redirect("/");
            }
            res.render("users/show",{user: foundUser, campgrounds:campgrounds});
        })
    });
});




module.exports = router;