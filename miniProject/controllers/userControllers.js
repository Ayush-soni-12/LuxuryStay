const User = require("../../Modals/user.js");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../middlewares/asyncHandler");
const { sendMail } = require("../Helpers/mailer.js");
const randomString = require("randomstring");
const PasswordReset = require("../../Modals/password.js");
const ExpressError = require("../middlewares/ExpressError");
const generateToken = require("../Helpers/generateToken.js");
const path = require("path");
const { deleteFile } = require("../Helpers/deleteFile.js");
const {logger} = require("../utils/logger");
const passport = require('passport');
const redis = require("../../utils/ioredisClient.js")
const jwt = require("jsonwebtoken");
const Listing = require("../../Modals/listing.js");
const Booking = require("../../Modals/booking.js")
const { cloudinary } = require("../../CloudConfig");
const { error } = require("console");



module.exports.userRegister = asyncHandler(async (req, res) => {
    const { name, email, Phone_No, password } = req.body;
    console.log(req.body)
    logger.info(`Trying to register user with email: ${email}`);
    const isExist = await User.findOne({ email });

    if (isExist) {
        if (req.file) {
            const imagePath = path.join(__dirname, "../public/images", req.file.filename);
            deleteFile(imagePath);
        }

        logger.error(`User already exists: ${email}`,{userEmail:email});
      return  res.status(400).redirect("/api/signup?message="+encodeURIComponent("User already exist"))
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const imagePath = req.file ? "images/" + req.file.filename : "images/default.png";

    const newUser = new User({
        name,
        email,
        Phone_No,
        password: hashPassword,
        image: imagePath,
    });

    const userdata = await newUser.save();
    const msg = `<p>Hi ${name}, Please <a href="https://luxurystays.site/mailVerification?id=${userdata._id}">verify</a> your mail.</p>`;
 
    await sendMail(email, "Mail verification", msg);

    logger.info(`User registered successfully: ${email}`);
     
    return res.redirect("/show?message="+ encodeURIComponent("Mail is sent , Please verify it") );
});
module.exports.userSignup = (req,res)=>{
    res.render("signup.ejs",{cssFile:'signup.css',message:req.query.message||null})
}


module.exports.mailVerification = asyncHandler(async (req, res) => {
    logger.info(`Mail verification requested for ID: ${req.query.id}`);
    if (!req.query.id) {
        return res.render("error.ejs", { message: "404 Not found" });
    }

    const userData = await User.findOne({ _id: req.query.id });
    if (!userData) {
        logger.warn(`Mail verification: User not found with ID: ${req.query.id}`);
        return res.render("mailVerification", { message: "User not found" });
    }

    if (userData.is_verified === 1) {
        logger.info(`Email already verified: ${userData.email}`);
        res.redirect("/show?message="+encodeURIComponent("Your email has already been verified!"))

    }

    await User.findByIdAndUpdate(userData._id, { is_verified: 1 });

    const accessToken = generateToken(res, userData._id);
    logger.info(`Email verification successful: ${userData.email}`);

    return res.redirect("/show?message="+ encodeURIComponent("User registration successfully!") );
});

module.exports.sendMailAgain = asyncHandler(async (req, res) => {
    const { email } = req.body;
    logger.info(`Resend verification mail requested for email: ${email}`);

    const userData = await User.findOne({ email });
    if (!userData) {
        logger.error(`Resend mail: Email not found - ${email}`);
        return res.status(400).render("mailVerification", { message: "Email does not exist" });
    }

    if (userData.is_verified === 1) {
        logger.warn(`Resend mail: Email already verified - ${email}`);
        throw new ExpressError("Your email is already verified", 400);
    }

     const msg = `<p>Hi ${userData.name}, Please <a href="https://luxurystays.site/mailVerification?id=${userData._id}">verify</a> your mail.</p>`;
    await sendMail(userData.email, "Mail verification", msg);

    logger.info(`Verification email re-sent to ${email}`);

    return res.status(200).render("mailVerification", { message: "Mail is sent to your email" });
});

module.exports.forgotpassword = (req,res)=>{
    res.render("forgotPassword.ejs",{message:req.query.message||null})
}

module.exports.passwordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    logger.info(`Password reset requested for email: ${email}`);

    const userData = await User.findOne({ email });
    if (!userData) {
        logger.error(`Password reset: Email not found - ${email}`,{userEmail:email});
        return res.status(400).redirect("/api/forgotpassword?message="+encodeURIComponent("Email not found"));
    }

    const randomToken = randomString.generate();
    const msg = `<p>Hi ${userData.name}, Please <a href="https://luxurystays.site/ResetPassword?token=${randomToken}">reset</a> your password.</p>`;

    await PasswordReset.deleteMany({ user_id: userData._id });

    const newPassword = new PasswordReset({
        user_id: userData._id,
        token: randomToken,
    });
    await newPassword.save();

    await sendMail(email, "Reset password", msg);
    logger.info(`Password reset token sent to: ${email}`);
res.redirect("/show?message="+encodeURIComponent("For reset the password, a link has been sent to your email"))
});

module.exports.ResetPassword = asyncHandler(async (req, res) => {
    logger.info(`Rendering reset password page for token: ${req.query.token}`);
    if (!req.query.token) {
        return res.render("error.ejs", {cssFile:"error.css", message: "404 Not found" });
    }

    const resetData = await PasswordReset.findOne({ token: req.query.token });
    if (!resetData) {
        logger.error(`ResetPassword: Invalid token: ${req.query.token}`,{userEmail:email});
        return res.render("error.ejs", { cssFile:"error.css" ,message: "404 not found" });
    }

    return res.render("ResetPassword", { resetData,message:req.query.message||null });
});

module.exports.updatePassword = asyncHandler(async (req, res) => {
    const { user_id, password, confirmPassword } = req.body;
    logger.info(`Updating password for user ID: ${user_id}`);
    const resetData = await PasswordReset.findOne({ user_id });

if (password != confirmPassword) {
    logger.warn(`Password mismatch for user ID: ${user_id}`);
    const token = resetData ? resetData.token : "";
    return res.redirect("/ResetPassword?token=" + token + "&message=" + encodeURIComponent("Password and confirm password do not match"));
}

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    await User.findByIdAndUpdate(user_id, { password: hashPassword });
    await PasswordReset.deleteOne({ user_id });

    logger.info(`Password updated successfully for user ID: ${user_id}`);
    return res.redirect("/show?message="+encodeURIComponent("`Password updated successfully"));
});

module.exports.ResetSuccess = asyncHandler(async (req, res) => {
    res.render("ResetSuccess");
});

module.exports.loginPage =(req,res)=>{
    res.render("login.ejs",{cssFile:'signup.css',message:req.query.message||null})
}

module.exports.userLogin = asyncHandler(async (req, res) => {
    if (req.cookies.jwt) {
        return res.redirect("/show?message="+encodeURIComponent("You are already logged in"));
       
    }

    const { email, password } = req.body;
    logger.info(`Login requested for email: ${email}`);
    const userData = await User.findOne({ email });

    if (!userData) {
        logger.error(`Login failed: Email not found - ${email}`,{userEmail:email});
        res.status(400).redirect(`/api/login?message=`+encodeURIComponent("Email and password is incorrect"))
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
        logger.error(`Login failed: Incorrect password for ${email}`,{userEmail:email});
        res.status(400).redirect(`/api/login?message=`+encodeURIComponent("Email and password is incorrect"))
    }

    if (userData.is_verified == 0) {
        logger.warn(`Login attempt with unverified email: ${email}`);
        throw new ExpressError("please verify your account", 400);
    }

    const otp = randomString.generate({ length: 6, charset: "numeric" });


    redis.set(`otp:${userData._id}`, otp, 'EX', 300);


    const msg = `<p>Your OTP for login is: <strong>${otp}</strong></p>`;
    await sendMail(email, "Login OTP", msg);

    logger.info(`OTP sent for login to ${email}`);

    res.render("otp.ejs", { userData ,message:"OTP is sent to your email"});
});

module.exports.verifyOtp = asyncHandler(async (req, res) => {
    const { id } = req.query;
    const { otp } = req.body;
    logger.info(`Verifying OTP for user ID: ${id}`);

    const userData = await User.findById(id);
    if (!userData) {
        logger.error(`OTP verification failed: User not found - ID: ${id}`,{userEmail:email});
        throw new ExpressError("User not found", 404);
    }

    const storedOtp = await redis.get(`otp:${userData._id}`);
    if(storedOtp===otp){
    const accessToken = generateToken(res, userData._id);
    logger.info(`OTP verified for ${userData.email}`);
    return res.redirect("/show?message="+ encodeURIComponent("Login successfully ! done") );
    }
    else{
      logger.error(`OTP verification failed: Invalid/Expired OTP for ${userData.email}`,{userEmail:email});
    throw new ExpressError("Invalid or expired OTP", 400);
    }



});

module.exports.resendOtp = asyncHandler(async (req, res) => {
    const { id } = req.query;
    logger.info(`Resending OTP for user ID: ${id}`);

    const userData = await User.findById(id);
    if (!userData) {
        logger.error(`Resend OTP failed: User not found - ID: ${id}`,{userEmail:email});
        throw new ExpressError("User not found", 404);
    }

    const otp = randomString.generate({ length: 6, charset: "numeric" });
    redis.set(`otp:${userData._id}`, otp, 'EX', 300);



    const msg = `<p>Your new OTP for login is: <strong>${otp}</strong></p>`;
    await sendMail(userData.email, "Resend OTP", msg);

    logger.info(`OTP re-sent to ${userData.email}`);
    // res.redirect(`/resend-otp?id=${id}`);
    return res.render("otp.ejs", { userData ,message:"OTP is sent to your email"});
});

module.exports.userProfile = asyncHandler(async (req, res) => {
    const userData = req.user;
    if (!userData) {
        logger.error(`Profile fetch failed: User not found`,{userEmail:email});
        throw new ExpressError("User not found", 404);
    }

    // Get listing count for the user
    const listingCount = await Listing.countDocuments({ owner: userData._id });
    
    // Get booking count for the user
    const bookingCount = await Booking.countDocuments({ guest: userData._id });
    
    // Add counts to userData
    userData.listingCount = listingCount;
    userData.bookingCount = bookingCount;

    logger.info(`Fetching profile for user: ${userData.email}`);
    return res.render("guest.ejs", { userData, cssFile: "editProfile.css" });
});
module.exports.editProfile  = asyncHandler(async(req,res)=>{
    const userData = req.user;
    if(!userData){
        return res.status(400).rendirect("/api/login?message="+encodeURIComponent("Please login first"))
    }
    res.render("editProfile.ejs", { userData, cssFile: "editProfile.css",message:req.query.message||null} );
})


module.exports.updateProfile = asyncHandler(async (req, res) => {
    const { name, phone_No } = req.body;
    const data = { name, phone_No };
    const user_id = req.user._id;

    const oldUser = await User.findById(user_id);

    if (req.file) {
      
        if (oldUser && oldUser.image_id) {
            await cloudinary.uploader.destroy(oldUser.image_id);
        }
        data.image = req.file.path; // Cloudinary URL
        data.image_id = req.file.filename; // Cloudinary public_id
    }

    const updatedData = await User.findByIdAndUpdate(user_id, data, { new: true });
    if (!updatedData) {
        logger.error(`Update profile failed: User not found - ID: ${user_id}`, { userEmail: req.user.email });
        throw new ExpressError("User not found", 404);
    }

    res.redirect("/api/profile?message=" + encodeURIComponent("Profile updated successfully!"));
});






module.exports.userLogout = asyncHandler(async (req, res) => {
    const token = req.cookies.jwt;
    if (token) {
        try {
            const decoded = jwt.decode(token); // decode without verifying

            const expiresAt = decoded.exp - Math.floor(Date.now() / 1000); 
            console.log(expiresAt)// seconds remaining

            if (expiresAt > 0) {
                await redis.setex(`blacklist:${token}`, expiresAt, "blacklisted");
            }
        } catch (err) {
            console.error("Error decoding JWT during logout:", err.message);
        }
    }

    res.clearCookie("jwt", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    logger.info(`User logged out: ${req.user.email || "unknown"}`);

    return res.redirect("/show?message=" + encodeURIComponent("Logout successfully!"));
});


module.exports.googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email'],
        prompt: 'login',
  });
module.exports.googleOauth = (req, res, next) => {
    console.log('Handling Google OAuth callback...');
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err || !user) {
            console.error('Google OAuth failed:', err || info);
            return res.redirect('/api/login?message=' + encodeURIComponent('Google authentication failed.'));
        }

        // Generate a token for the authenticated user
        const accessToken = generateToken(res,user._id);
        console.log('Google OAuth successful for user:', user.email);
        return res.redirect('/show');
    })(req, res, next);
};



module.exports.Booking = asyncHandler(async (req, res) => {
  
  function iterateDates(startDate, endDate, callback) {
    const date = new Date(startDate);
    while (date < endDate) {
      callback(date.toISOString().split("T")[0]);
      date.setDate(date.getDate() + 1);
    }
  }

  const { listingId } = req.params;
  const { checkin, checkout, guests, total, numberOfRoom } = req.body;

  if (!numberOfRoom) {
return res.redirect(`/show/${listingId}/view?message=` + encodeURIComponent("Please select number of rooms"));
  }

  if (!total || total <= 0) {
    return res.status(400).json({ success: false, message: "Invalid total amount." });
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
return res.redirect(`/show/${listingId}/view?message=` + encodeURIComponent("Listing not found"));
  }

  const start = new Date(checkin);
  const end = new Date(checkout);

  // Check availability for each date
  let isAvailable = true;
  let unavailableDate = null;

  iterateDates(start, end, (dateStr) => {
    const remaining = listing.bookingCalendar.get(dateStr) ?? listing.totalRooms;
    if (remaining < numberOfRoom) {
      isAvailable = false;
      unavailableDate = dateStr;
    }
  });

  if (!isAvailable) {
return res.redirect(`/show/${listingId}/view?message=` + encodeURIComponent(`Not enough rooms available on ${unavailableDate}`));
  }

 
  iterateDates(start, end, (dateStr) => {
    const prevRemaining = listing.bookingCalendar.get(dateStr) ?? listing.totalRooms;
    listing.bookingCalendar.set(dateStr, prevRemaining - numberOfRoom);
  });

  await listing.save();

  const bookingNumber = randomString.generate({ length: 6, charset: "numeric" });

  const msg = `
    <p>Dear ${req.user.name},</p>
    <p>Thank you for booking with us! Your booking has been successfully confirmed.</p>
    <p><strong>Booking Details:</strong></p>
    <ul>
        <li><strong>Listing:</strong> ${listing.title}</li>
        <li><strong>Number of Rooms:</strong> ${numberOfRoom}</li>
        <li><strong>Check-in Date:</strong> ${start.toISOString().split("T")[0]}</li>
        <li><strong>Check-out Date:</strong> ${end.toISOString().split("T")[0]}</li>
        <li><strong>Guests:</strong> ${guests}</li>
        <li><strong>Total Amount:</strong> ₹${total}</li>
        <li><strong>Your Booking Number is ${bookingNumber}</strong></li>
    </ul>
    <p>If you have any questions or need further assistance, feel free to contact us. <a href="https://luxurystays.site/show/contact">Contact us</a></p>
    <p>We look forward to hosting you!</p>
    <p>Best regards,</p>
    <p><strong>LuxuryStay</strong></p>
  `;

  await sendMail(req.user.email, "Booking Confirmation", msg);

  // Create and save booking document
  const newBooking = new Booking({
    listing: listingId,
    guest: req.user._id,
    checkin: start.toISOString().split("T")[0],
    checkout: end.toISOString().split("T")[0],
    guests,
    total,
    numberOfRoom,
    bookingNumber,
  });

  await newBooking.save();

  return res.redirect(
    `/show/${listingId}/view?message=` +
      encodeURIComponent(`Booking confirmed for dates ${checkin} to ${checkout}`)
  );
});



module.exports.CancelBooking = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assuming the user is authenticated

    // Fetch all bookings for the user
    const bookings = await Booking.find({ guest: userId }).populate("listing");

    if (!bookings || bookings.length === 0) {
        return res.redirect(`/show?message=` + encodeURIComponent("No booking found ."));
    }

    // Group bookings by listing
    const groupedBookings = bookings.reduce((acc, booking) => {
        const listingId = booking.listing._id;
        if (!acc[listingId]) {
            acc[listingId] = {
                listing: booking.listing,
                bookings: [],
            };
        }
        acc[listingId].bookings.push(booking);
        return acc;
    }, {});

  
    return res.render("cancelBooking.ejs", { groupedBookings, cssFile:"booking.css" });
});

module.exports.BookingCancelConfirm = asyncHandler(async(req,res)=>{
    const { id } = req.params; // Booking ID


    const booking = await Booking.findById(id).populate("listing");
  if (!booking) {
    return res.redirect(`/show?message=` + encodeURIComponent("Booking not found"));
  }

  const { checkin, checkout, numberOfRoom } = booking;
  const listing = booking.listing;

  // Restore rooms in bookingCalendar
  const start = new Date(checkin);
  const end = new Date(checkout);
  const current = new Date(start);

  while (current < end) {
    const dateStr = current.toISOString().split("T")[0];
    const booked = listing.bookingCalendar.get(dateStr) ?? listing.totalRooms;

    listing.bookingCalendar.set(dateStr, booked + numberOfRoom);
    current.setDate(current.getDate() + 1);
  }

  await listing.save();
    await Booking.findByIdAndDelete(id);
    return res.redirect(`/show?message=` + encodeURIComponent("Booking canceled successfully."));
})
module.exports.becomeHost = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        // Check if user is already a host or has a pending application
        const existingUser = await User.findById(userId);
        if (existingUser.isHost) {
            return res.redirect("/api/profile?message=" + encodeURIComponent("You are already a host!"));
        }

        // Handle file uploads
        const idProofResult = req.files['idProof'] ? await cloudinary.uploader.upload(req.files['idProof'][0].path, {
            folder: 'host-documents'
        }) : null;

        const addressProofResult = req.files['addressProof'] ? await cloudinary.uploader.upload(req.files['addressProof'][0].path, {
            folder: 'host-documents'
        }) : null;

        if (!idProofResult || !addressProofResult) {
            return res.redirect("/api/profile?message=" + encodeURIComponent("Please upload all required documents"));
        }

        // Update user record
        const updatedUser = await User.findByIdAndUpdate(userId, {
            isHost: true,
            hostVerified: false,
            hostApplicationDate: new Date(),
            hostVerificationDocuments: {
                idProof: idProofResult.secure_url,
                addressProof: addressProofResult.secure_url
            }
        }, { new: true });

        // Send email notification
        const msg = `
            <h2>New Host Application</h2>
            <p>A new host application has been submitted:</p>
            <ul>
                <li>Name: ${updatedUser.name}</li>
                <li>Email: ${updatedUser.email}</li>
                <li>Application Date: ${new Date().toLocaleString()}</li>
            </ul>
        `;
        
        // Send confirmation email to user
        await sendMail(updatedUser.email, "Host Application Received", 
            `<p>Dear ${updatedUser.name},</p>
             <p>We have received your host application. Our team will review your documents and get back to you within 48 hours.</p>
             <p>Thank you for choosing to become a host with us!</p>`
        );

        // Send notification to admin (you can replace this with your admin email)
        await sendMail(process.env.SMTP_MAIL || "admin@luxurystays.com", "New Host Application", msg);

        logger.info(`Host application submitted for user: ${updatedUser.email}`);
        return res.redirect("/api/profile?message=" + encodeURIComponent("Your host application has been submitted successfully!"));

    } catch (error) {
        logger.error(`Host application error: ${error.message}`);
        return res.redirect("/api/profile?message=" + encodeURIComponent("Error submitting host application. Please try again."));
    }
});

module.exports.getHostStatus = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
        throw new ExpressError("User not found", 404);
    }

    return res.json({
        isHost: user.isHost,
        hostVerified: user.hostVerified,
        applicationDate: user.hostApplicationDate
    });
});

module.exports.getHostApplications = asyncHandler(async (req, res) => {
    const pendingHosts = await User.find({ 
        isHost: true, 
        hostVerified: false 
    }).select('name email hostApplicationDate hostVerificationDocuments');

    res.render("adminHostApplications.ejs", { 
        pendingHosts,
        cssFile: 'adminDashboard.css',
        message: req.query.message || null 
    });
});

module.exports.verifyHost = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
        throw new ExpressError("User not found", 404);
    }

    user.hostVerified = true;
    await user.save();

    // Send confirmation email to user
    const msg = `
        <h2>Congratulations! You're now a verified host!</h2>
        <p>Dear ${user.name},</p>
        <p>Your host application has been approved. You can now start listing your properties on LuxuryStays.</p>
        <p>Get started by clicking the "List a New Property" button on your dashboard.</p>
        <p>Best regards,<br>LuxuryStays Team</p>
    `;
    
    await sendMail(user.email, "Host Application Approved!", msg);
    logger.info(`Host verified: ${user.email}`);

    return res.redirect("/api/admin/host-applications?message=" + encodeURIComponent("Host verified successfully"));
});

module.exports.rejectHost = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        throw new ExpressError("User not found", 404);
    }

    user.isHost = false;
    user.hostVerified = false;
    await user.save();

    // Send rejection email to user
    const msg = `
        <h2>Host Application Update</h2>
        <p>Dear ${user.name},</p>
        <p>We've reviewed your host application and unfortunately, we cannot approve it at this time.</p>
        <p><strong>Reason:</strong> ${reason || 'Your application does not meet our current requirements.'}</p>
        <p>You can apply again after addressing the following:</p>
        <ul>
            <li>Ensure all documents are clear and valid</li>
            <li>Verify your identity and address information</li>
            <li>Meet all host requirements</li>
        </ul>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>LuxuryStays Team</p>
    `;
    
    await sendMail(user.email, "Host Application Status Update", msg);
    logger.info(`Host application rejected: ${user.email}`);

    return res.redirect("/api/admin/host-applications?message=" + encodeURIComponent("Host application rejected"));
});


module.exports.Profile = asyncHandler(async (req, res) => {
const UserData = await User.findById(req.params.userId).select("-password -__v");
if (!UserData) {
    logger.error(`User profile not found for ID: ${req.params.userId}`, { userEmail: req.user.email });
   return res.redirect("/show?message=" + encodeURIComponent("User not found"));
}
res.render("userProfile.ejs", { userData: UserData, cssFile: "userProfile.css", message: req.query.message || null });

});