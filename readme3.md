#YelpCamp

##Initial Setup
* Add Landing Page
* Add Campgrounds Page that lists all campgrounds

Each Campground has:
   * Name
   * Image

#Layout and Basic Styling
* Create our header and footer partials
* Add in Bootstrap

#Creating New Campgrounds
* Setup new campground POST route
* Add in body-parser
* Setup route to show form
* Add basic unstyled form

#Style the campgrounds page
* Add a better header/title
* Make campgrounds display in a grid

#Style the Navbar and Form
* Add a navbar to all templates
* Style the new campground form

#Add Mongoose
* Install and configure Mongoose
* Setup campground model
* Use campground model inside of our routes

#Show Page
* Review the RESTful routes we've seen so far
* Add description to our campground model
* Show db.collection.drop()
* Add a show route/template

#Refactor Mongoose Code
* Create a models directory
* Use module.exports
* Require everything correctly!

#Add Seeds File
* Add a seeds.js file
* Run the seeds file every time the server starts

#Add the Comment model!
* Make our errors go away!
* Display comments on campground show page


REST - a mapping between HTTP routes and CRUD(Create, Read, Update, Destroy)

RESTFULL ROUTES

name    url             verb        desc                         Mongoose Method

================================================================================
INDEX   /dogs           GET     Display a list of all dog        Dog.find()
NEW     /dogs/new       GET     Display form to make a new dog   N/A
CREATE  /dogs           POST    Add new dog to DB                Dog.created()
SHOW    /dogs/:id       GET     show info about one dog          Dog.findById()
EDIT    /dogs/:id/edit  GET     show edit form for one dog       Dog.findById()
UPDATE  /dogs/:id       PUT     Update and redirect              Dog.findByIdAndUpdate()
DESTROY /dogs/:id       DELETE  Delete and redirect              Dog.findByIdAndRemove()