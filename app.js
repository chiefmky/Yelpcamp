require('dotenv').config();

var express = require("express"),
    app = express(),
    bodyParser=require("body-parser"),
    mongoose=require("mongoose"),
    flash = require("connect-flash"),
    passport = require("passport"),
    User = require("./models/user"),
    localStratergy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    seedDB = require("./seeds"),
    methodOverride =require("method-override");

//require route
var commentRoutes= require("./routes/comments"),
    campgroundRoutes= require("./routes/campgrounds"),
    indexRoutes = require("./routes/index");

//console.log(process.env.DATABASEURL);
mongoose.connect(process.env.DATABASEURL);


//mongolab
//mongoose.connect("mongodb://moise:brigitte0903@ds153705.mlab.com:53705/yelpcamp");

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");
// seedDB(); //seed the database

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret:"Rusty is the best and cutest dog in the world",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/",indexRoutes);
app.use("/campgrounds",campgroundRoutes);
app.use("/campgrounds/:id/comments",commentRoutes);



app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YelpCamp Server started");
});