// File: Major_project/myApp/index.js

// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config();
// }
require("dotenv").config();
  
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
  const cookieParser = require("cookie-parser");
const dialogflow = require('@google-cloud/dialogflow');
const passport = require('passport');
const validToken = require("./miniProject/middlewares/validateToken.js");
require('./miniProject/Helpers/passport.js');

/////////////////////////////// DATABASE setup/////////////////////////////////////////////////////////


  // const Mongoose_Url = "mongodb://127.0.0.1:27017/wanderlust";
  // async function main() {
  //   await mongoose.connect(Mongoose_Url);
  //   console.log("Connected to MajorProject DB");
  // }
  // main().catch((err) => {
  //   console.error(`MajorProject DB connection error: ${err}`);
  // });


mongoose.set("debug", true); // optional, for logging
const Mongoose_Url = "mongodb://root:example@mongodb:27017/wanderlust?authSource=admin";


async function main() {
  await mongoose.connect(Mongoose_Url);
  console.log("✅ Connected to MajorProject DB");
}

main().catch((err) => {
  console.error(`❌ MajorProject DB connection error: ${err}`);
});
  
  /////////////////////////////////////////////// Middleware//////////////////////////////////////////////////////

  app.use(express.static(path.join(__dirname, "public")));
  app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride("_method"));
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");
  app.use(cookieParser());
  app.use(passport.initialize());
  // app.use(validToken)


  
  /////////////////////////////////////////////////////////////////// Use your app routes //////////////////////////////////////////////////////////
  app.use("/show", listings);
  app.use("/show/:id/reviews", reviews);
  app.use("/api", userRoutes);
  app.use("/",AuthRoutes)
  app.use("/",Oauth)



  ///////////////////////////////////////// CHAT BOT ////////////////////////////////////////////////////////////////////////////////////

  const projectId = 'airnb-jgvt';
  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: 'C:/Users/sudhi/Major_project/airnb-jgvt-0d320e410185.json',
  });
  

  // Render the chat page
app.get('/chatbot', (req, res) => {
  res.render('chat.ejs',{cssFile:'chat.css'}); // Render the EJS template
});

// Handle chat requests
app.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body;

  // const sessionId = uuid.v4(); // You are getting sessionId from the frontend
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  const request = {
      session: sessionPath,
      queryInput: {
          text: {
              text: message,
              languageCode: 'en-US',
          },
      },
  };

  try {
      const responses = await sessionClient.detectIntent(request);
      const result = responses[0].queryResult;

      // --- Troubleshooting Steps ---
      console.log("Dialogflow Fulfillment Text:", result.fulfillmentText);
      res.setHeader('Content-Type', 'application/json'); // Explicitly set Content-Type
      res.json({ reply: result.fulfillmentText });
  } catch (error) {
      console.error('Dialogflow error:', error);
      res.setHeader('Content-Type', 'application/json'); // Explicitly set Content-Type for error too
      res.status(500).json({ reply: 'Sorry, something went wrong with the chatbot service.' });
  }
});







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
    res.status(statusCode).render("error.ejs", { err });
  });
  
  // Start server
  app.listen(8080, () => {
    console.log("Server is running on port 8080");
  });
  


