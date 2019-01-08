var express = require("express"),
    router = express.Router(),
    Campground = require("../models/campground"),
    middleware = require("../middleware/"),
    NodeGeocoder = require('node-geocoder'),
    User = require("../models/user"),
    multer = require('multer'),
    Notification = require("../models/notification"),
    vmiddleware = require("../middleware");
    
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

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'myelpcamp-moise', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);


//INDEX ROUTE -- show all campgrounds
router.get("/", function(req, res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count({name: regex}).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allCampgrounds.length < 1) {
                        noMatch = "No campgrounds match that query, please try again.";
                    }
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        // get all campgrounds from DB
        Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), async function(req, res){
  try {
  	// add author object to campground on req.body
	req.body.campground.author = {
	    id: req.user._id,
	    username: req.user.username
	}
	// check if file uploaded
  	if(req.file) {		
  	  // upload file to cloudinary
	  let result = await cloudinary.v2.uploader.upload(req.file.path);
	  // assign to campground object
	  req.body.campground.image = result.secure_url;
	  req.body.campground.imageId = result.public_id;
  	}
  	  // geocode location
	  let data = await geocoder.geocode(req.body.location);
	  // assign lat and lng and update location with formatted address
	  req.body.campground.lat = data[0].latitude;
	  req.body.campground.lng = data[0].longitude;
	  req.body.campground.location = data[0].formattedAddress;
	  // create campground from updated req.body.campground object
	  let campground = await Campground.create(req.body.campground);
	  let user = await User.findById(req.user._id).populate('followers').exec();
      let newNotification = {
        username: req.user.username,
        campgroundId: campground.id
      }
      for(const follower of user.followers) {
        let notification = await Notification.create(newNotification);
        follower.notifications.push(notification);
        follower.save();
      }
	  // redirect to campground show page
	  res.redirect("/campgrounds/" + campground._id);
	} catch(err) {
	    // flash error and redirect to previous page
	    req.flash('error', err.message);
	    res.redirect('back');
	}
});

//NEW ROUTE -- show form to create new campground
router.get("/new",middleware.isLoggedIn,function(req, res){
    res.render("campgrounds/new");
});

//SHOW ROUTE -- show more info about one campground
router.get("/:id", function(req, res) {
 //find the campground with that id
 Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
     if(err || !foundCampground){
        req.flash("error", "Campground not found");
        res.redirect("back");
     }else{
         //rendered for all campground
            res.render("campgrounds/show",{campground:foundCampground});
        }
 });
});

//EDIT ROUTE --show edit form for one campground
router.get("/:id/edit",middleware.checkCampgroundOwnership,function(req, res) {
    //check user logged in
       Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("back");
        }else{
               res.render("campgrounds/edit", {campground: foundCampground}) 
            }
      }); 
});
//UPDATE ROUTE --Update a campground and redirect
router.put("/:id", upload.single('image'), function(req, res){
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.name = req.body.name;
            campground.description = req.body.description;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

//DELETE ROUTE --delete a campground and redirect
router.delete("/:id",middleware.checkCampgroundOwnership,function(req, res){
    Campground.findById(req.params.id, async function(err, campground) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(campground.imageId);
        campground.remove();
        req.flash('success', 'Campground deleted successfully!');
        res.redirect('/campgrounds');
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;

