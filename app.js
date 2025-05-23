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
const fs = require("fs");
const validToken = require("./miniProject/middlewares/validateToken.js");
const setCurrentUser = require("./miniProject/middlewares/setCurrentUser.js");
const Listing = require("./Modals/listing.js");
const Booking = require("./Modals/booking.js");
const User = require("./Modals/user.js");
require('./miniProject/Helpers/passport.js');
const getUserStats = require("./middleware/getUserStats.js");

/////////////////////////////// DATABASE setup/////////////////////////////////////////////////////////




const Mongoose_Url = "mongodb://wanderlust:test123@localhost:27017/wanderlust?authSource=admin";
  async function main() {
    await mongoose.connect(Mongoose_Url,{
   tls: true,
    tlsCAFile: process.env.MONGO_CA_PATH,
    tlsCertificateKeyFile: process.env.MONGO_CERT_PATH,
      // tlsAllowInvalidHostnames: true,
    });
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
  app.use("/",AuthRoutes)
  app.use("/",Oauth)



  ///////////////////////////////////////// CHAT BOT ////////////////////////////////////////////////////////////////////////////////////

  const projectId = 'airnb-jgvt';
  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: 'C:/Users/sudhi/Major_project/airnb-jgvt-0d320e410185.json',
  });
  // const backendBookingSessions = {};
  

  // Render the chat page
app.get('/chatbot',validToken, (req, res) => {
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








// app.post('/chat', async (req, res) => {
//     const { message, sessionId } = req.body;

//     const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

//     const request = {
//         session: sessionPath,
//         queryInput: {
//             text: {
//                 text: message,
//                 languageCode: 'en-US',
//             },
//         },
//     };

//     try {
//         const responses = await sessionClient.detectIntent(request);
//         const result = responses[0].queryResult;

//         const intentName = result.intent.displayName;
//         const parameters = result.parameters.fields; // Access parameters more easily

//         let replyText = result.fulfillmentText; // Default reply from Dialogflow

//         // --- Start of Intent-Specific Logic ---
//         if (intentName === 'Booking_help') {
//             console.log('Booking help intent triggered.');
//             // Dialogflow's default response for this intent is usually sufficient here.
//             // No complex backend logic needed immediately.
//         } else if (intentName === 'Booking_help - custom') {
//             const hotelName = parameters['hotel-name']?.stringValue;
//             const city = parameters['geo-city']?.stringValue;
//             const dateTime = parameters['date-time']?.stringValue; // This will be ISO string

//             console.log(`Booking_help - custom triggered. Hotel: ${hotelName}, City: ${city}, DateTime: ${dateTime}`);

//             // --- Validate Hotel and Location (Replace with your actual DB logic) ---
//             const isValidHotelLocation = await validateHotelLocation(hotelName, city);

//             if (isValidHotelLocation) {
//                 // Store booking details temporarily
//                 backendBookingSessions[sessionId] = { hotelName, city, dateTime };
//                 console.log('Hotel and location validated. Stored in session:', backendBookingSessions[sessionId]);
//                 // Dialogflow's fulfillmentText will be used: "Great! I’ve noted the details..."
//             } else {
//                 replyText = `Sorry, we don't have a hotel named ${hotelName || 'that hotel'} in ${city || 'that city'}. Could you please check the name or try a different location?`;
//                 // Clear session data if invalid
//                 delete backendBookingSessions[sessionId];
//                 console.log('Invalid hotel or location. Session cleared.');
//             }
//         } else if (intentName === 'Booking_help - custom - custom') {
//             const name = parameters['person']?.structValue?.fields?.name?.stringValue || parameters['person']?.stringValue; // Handle both @sys.person and custom name entity
//             const email = parameters['email']?.stringValue;

//             console.log(`Booking_help - custom - custom triggered. User: ${userName}, Email: ${userEmail}`);

//             // --- Authenticate User (Replace with your actual authentication logic) ---
//             // If using JWT, you'd ideally have req.user from middleware here
//             const isAuthorized = await authenticateUser(name, email);

//             if (isAuthorized) {
//                 const bookingDetails = backendBookingSessions[sessionId];
//                 if (bookingDetails) {
//                     const { hotelName, city, dateTime } = bookingDetails;

//                     // --- Create Booking and Get Booking ID (Replace with your actual DB logic) ---
//                     const bookingId = generateBookingId(); // Placeholder for actual booking ID generation
//                     const bookingSuccess = await createNewBooking(name, email, hotelName, city, dateTime, bookingId);

//                     if (bookingSuccess) {
//                         // --- Send Confirmation Email (Replace with your actual Nodemailer logic) ---
//                         await sendBookingConfirmationEmail(userEmail, bookingId, hotelName, city, dateTime);

//                         replyText = `Your booking is confirmed! Your booking ID is ${bookingId}. A confirmation email has been sent to ${userEmail}.`;
//                         delete backendBookingSessions[sessionId]; // Clear session data after successful booking
//                         console.log('Booking finalized and email sent. Session cleared.');
//                     } else {
//                         replyText = 'Sorry, there was an error finalizing your booking in our system.';
//                         console.error('Failed to create new booking in DB.');
//                     }
//                 } else {
//                     replyText = 'It seems the hotel details were lost. Please start the booking process again.';
//                     console.warn('Booking details missing from session for sessionId:', sessionId);
//                 }
//             } else {
//                 replyText = `Your name or email doesn't seem to match our authorized records. Please double-check the details you provided.`;
//                 console.log('Authentication failed for user:', userName, userEmail);
//             }
//         }
//         // --- End of Intent-Specific Logic ---

//         // --- Final Response to Frontend ---
//         res.setHeader('Content-Type', 'application/json');
//         res.json({ reply: replyText });

//     } catch (error) {
//         console.error('Dialogflow or backend error:', error);
//         res.setHeader('Content-Type', 'application/json');
//         res.status(500).json({ reply: 'Sorry, something went wrong with the chatbot service. Please try again later.' });
//     }
// });

// // --- Placeholder Functions (YOU MUST REPLACE THESE WITH YOUR REAL LOGIC) ---

// // In a real app, this would query your database of hotels
// async function validateHotelLocation(hotelName, city) {
//     if (!hotelName || !city) return false;
//     // Case-insensitive search for hotel name and city
//     const hotel = await Listing.findOne({
//         title: { $regex: new RegExp(`^${hotelName}$`, 'i') },
//         location: { $regex: new RegExp(`^${city}$`, 'i') }
//     });
//     return !!hotel;
// }

// // In a real app, this would check against your user database or JWT
// async function authenticateUser(name, email) {
//     if (!name || !email) return false;
//     // Case-insensitive search for name and email
//     const user = await User.findOne({
//         name: { $regex: new RegExp(`^${name}$`, 'i') },
//         email: { $regex: new RegExp(`^${email}$`, 'i') }
//     });
//     return !!user;
// }

// // In a real app, this would save to your database and return a generated ID
// async function createNewBooking(userName, userEmail, hotelName, city, dateTime, bookingId) {
//     try {
//         await Booking.create({
//             userName,
//             userEmail,
//             hotelName,
//             city,
//             dateTime,
//             bookingId
//         });
//         return true;
//     } catch (err) {
//         console.error("Booking creation failed:", err);
//         return false;
//     }
// }

// // Simple booking ID generator (replace with a robust one for production)
// function generateBookingId() {
//     return 'BOOK-' + Math.random().toString(36).substring(2, 9).toUpperCase();
// }

// // In a real app, this uses Nodemailer to send the email
// async function sendBookingConfirmationEmail(email, bookingId, hotelName, city, dateTime) {
//     console.log(`Sending confirmation email to ${email} for booking ${bookingId}...`);
//     const mailOptions = {
//         from: 'your_email@example.com', // Sender address
//         to: email,                       // List of recipients
//         subject: `Your Hotel Booking Confirmation - ID: ${bookingId}`, // Subject line
//         html: `
//             <p>Dear ${email},</p>
//             <p>Your booking for <b>${hotelName}</b> in <b>${city}</b> on <b>${new Date(dateTime).toLocaleDateString()}</b> is confirmed!</p>
//             <p>Your booking ID is: <b>${bookingId}</b></p>
//             <p>Thank you for choosing our service!</p>
//             <p>Regards,<br>Your Airbnb Clone Team</p>
//         `, // HTML body
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         console.log('Confirmation email sent successfully!');
//     } catch (error) {
//         console.error('Error sending confirmation email:', error);
//         // You might want to log this error and potentially notify an admin
//     }
// }








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
  app.listen(8080, () => {
    console.log("Server is running on port 8080");
  });
  


