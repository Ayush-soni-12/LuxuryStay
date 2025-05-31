

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
 
  console.log('Running in production mode');
} else {
 
  require('dotenv').config();
  console.log('Running in development mode');
}

const express = require("express");
  const app = express();
  const mongoose = require("mongoose");
  const methodOverride = require("method-override");
  const path = require("path");
  const ExpressError = require("./utils/ExpressError.js");
  const listings = require("./routes/listing.js");
  const reviews = require("./routes/review.js");
  const userRoutes = require("./miniProject/routes/UserRoute.js");
  const AuthRoutes = require("./miniProject/routes/authRoute.js")
  const Oauth  = require("./miniProject/routes/Oauth.js")
  const contact = require("./routes/contact.js");
  const cookieParser = require("cookie-parser");
const dialogflow = require('@google-cloud/dialogflow');
const passport = require('passport');
const fs = require("fs");
const validToken = require("./miniProject/middlewares/validateToken.js");
const setCurrentUser = require("./miniProject/middlewares/setCurrentUser.js");
const Listing = require("./Modals/listing.js");
const Booking = require("./Modals/booking.js");
const User = require("./Modals/user.js");
require('./miniProject/Helpers/passport.js');
const getUserStats = require("./middleware/getUserStats.js");


/////////////////////////////// DATABASE setup/////////////////////////////////////////////////////////





const Mongoose_Url = process.env.MONGO_URL
 
async function main() {
  await mongoose.connect(Mongoose_Url); // URI from .env file
  console.log("Connected to MajorProject DB");
}

main().catch((err) => {
  console.error(`MajorProject DB connection error: ${err}`);
});


// mongoose.set("debug", true); // optional, for logging
// const Mongoose_Url = "mongodb://root:example@mongodb:27017/wanderlust?authSource=admin";


// async function main() {
//   await mongoose.connect(Mongoose_Url);
//   console.log("✅ Connected to MajorProject DB");
// }

// main().catch((err) => {
//   console.error(`❌ MajorProject DB connection error: ${err}`);
// });
  
  /////////////////////////////////////////////// Middleware//////////////////////////////////////////////////////

  app.use(express.static(path.join(__dirname, "public")));
  app.use(getUserStats);
  app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride("_method"));
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(setCurrentUser);

  // app.use(validToken)


  
  /////////////////////////////////////////////////////////////////// Use your app routes //////////////////////////////////////////////////////////  
  app.use("/show", listings);
  app.use("/show/:id/reviews", reviews);
  app.use("/api", userRoutes);
  app.use("/",AuthRoutes);
  app.use("/",Oauth);
  app.use("/api", contact);

  ////////////////////////////////////////////////////// Custom Error Handlers/////////////////////////////////////////////////////////////
  const HandleValidationErr = (err) => {
    err.message = "Validation error. Please follow rules.";
    return err;
  };
  const HandleCastError = (err) => {
    err.message = "Cast error. Please check data types.";
    return err;
  };
  const HandletypeError = (err) => {
    console.log(err)
    return err;
  };
  
  app.use((err, req, res, next) => {
    if (err.name === "ValidationError") err = HandleValidationErr(err);
    else if (err.name === "CastError") err = HandleCastError(err);
    else if (err.name === "TypeError") err = HandletypeError(err);
    next(err);
  });
  
  app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
  });
  
  app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { err,cssFile:"error.css" });
  });
    // Start server
const port = process.env.SERVER_PORT || 8080;

app.listen(port,'0.0.0.0', () => {
    console.log(`Server running  on port ${port}`);
});
  


