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
const logger = require("../utils/logger");
const passport = require('passport');
const redis = require("../../utils/ioredisClient.js")
const jwt = require("jsonwebtoken");
const Listing = require("../../Modals/listing.js");
const Booking = require("../../Modals/booking.js")



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
    const msg = `<p>Hi ${name}, Please <a href="http://localhost:8080/mailVerification?id=${userdata._id}">verify</a> your mail.</p>`;
    await sendMail(email, "Mail verification", msg);

    logger.info(`User registered successfully: ${email}`);
     
    return res.redirect("/show?message="+ encodeURIComponent("mail is sent , Please verify it") );
});
module.exports.userSignup = (req,res)=>{
    res.render("signup.ejs",{cssFile:'signup.css',message:req.query.message||null})
}


module.exports.mailVerification = asyncHandler(async (req, res) => {
    logger.info(`Mail verification requested for ID: ${req.query.id}`);
    if (!req.query.id) {
        return res.render("Error", { message: "404 Not found" });
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

    const msg = `<p>Hi ${userData.name}, Please <a href="http://localhost:8080/mailVerification?id=${userData._id}">verify</a> your mail.</p>`;
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
    const msg = `<p>Hi ${userData.name}, Please <a href="http://localhost:8080/ResetPassword?token=${randomToken}">reset</a> your password.</p>`;

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
        return res.render("Error", { message: "404 Not found" });
    }

    const resetData = await PasswordReset.findOne({ token: req.query.token });
    if (!resetData) {
        logger.error(`ResetPassword: Invalid token: ${req.query.token}`,{userEmail:email});
        return res.render("Error", { message: "404 not found" });
    }

    return res.render("ResetPassword", { resetData});
});

module.exports.updatePassword = asyncHandler(async (req, res) => {
    const { user_id, password, confirmPassword } = req.body;
    logger.info(`Updating password for user ID: ${user_id}`);
    const data = await PasswordReset.findOne({ user_id });

    if (password != confirmPassword) {
        logger.warn(`Password mismatch for user ID: ${user_id}`);
        return res.render("ResetPassword", { message: 'Password not match with confirm password' });
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
        return res.status(200).json({
            success: true,
            message: "User already logged in",
        });
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

    // userData.otp = otp;
    // userData.otpExpires = Date.now() + 5 * 60 * 1000;
    // await userData.save();

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

    // if (userData.otp !== otp || userData.otpExpires < Date.now()) {
    //     logger.error(`OTP verification failed: Invalid/Expired OTP for ${userData.email}`,{userEmail:email});
    //     throw new ExpressError("Invalid or expired OTP", 400);
    // 
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

    // userData.otp = null;
    // userData.otpExpires = null;
    // await userData.save();


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

    // userData.otp = otp;
    // userData.otpExpires = Date.now() + 5 * 60 * 1000;
    // await userData.save();

    const msg = `<p>Your new OTP for login is: <strong>${otp}</strong></p>`;
    await sendMail(userData.email, "Resend OTP", msg);

    logger.info(`OTP re-sent to ${userData.email}`);
    res.redirect(`/resend-otp?id=${id}`);
});

module.exports.userProfile = asyncHandler(async (req, res) => {
    const userData = req.user;
    if (!userData) {
        logger.error(`Profile fetch failed: User not found`,{userEmail:email});
        throw new ExpressError("User not found", 404);
    }
    logger.info(`Fetching profile for user: ${userData.email}`);
    return res.status(200).json({
        success: true,
        user: userData,
    });
});

module.exports.updateProfile = asyncHandler(async (req, res) => {
    const { name, phone_No } = req.body;
    const data = { name, phone_No };
    const user_id = req.user._id;

    logger.info(`Updating profile for user: ${req.user.email}`);

    if (req.file !== undefined) {
        data.image = `images/${req.file.filename}`;
        const oldUser = await User.findOne({ _id: user_id });
        if (oldUser && oldUser.image !== "images/default.png") {
            const oldFilePath = path.join(__dirname, `../public/${oldUser.image}`);
            deleteFile(oldFilePath);
        }
    }

    const updatedData = await User.findByIdAndUpdate(user_id, data, { new: true });
    if (!updatedData) {
        logger.error(`Update profile failed: User not found - ID: ${user_id}`,{userEmail:email});
        throw new ExpressError("user not found ", 404);
    }

    logger.info(`Profile updated for user: ${updatedData.email}`);

    return res.status(200).json({
        success: true,
        user: updatedData,
    });
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
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
    });

    logger.info(`User logged out: ${req.user?.email || "unknown"}`);

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
        const accessToken = generateToken(res,user._id); // Ensure `generateToken` is implemented correctly
        console.log('Google OAuth successful for user:', user.email);
        return res.redirect('/show');
    })(req, res, next);
};

module.exports.Booking = asyncHandler(async(req,res)=>{
  
    const {listingId}  =req.params
    const {checkin,checkout,guests,total} = req.body;

    // console.log('Listing ID:', listingId); // Debug log
    // console.log('Request Body:', req.body); // Debug log

         // Validate the total value
         if (!total || total <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid total amount.' });
        }
        const listing = await Listing.findById(listingId);
        if(!listing){
            return res.status(400).json({
                success:true,
                message:"listing not found"
            })
        }


          // Check if there is an overlapping booking for the same listing
          const overlappingBooking = await Booking.findOne({
            listing: listingId,
            $or: [
                {
                    checkin: { $lt: new Date(checkout) },
                    checkout: { $gt: new Date(checkin) },
                },
            ],
        });

           if (overlappingBooking) {

             return  res.status(400).redirect(`/show/${listingId}/view?message=`+ encodeURIComponent(`This Listing is already booked for the selected dates ${checkin} to ${checkout}` ));    

            }


        const bookingNumber = randomString.generate({ length: 6, charset: "numeric" });
     

        const msg = `
        <p>Dear ${req.user.name},</p>
        <p>Thank you for booking with us! Your booking has been successfully confirmed.</p>
        <p><strong>Booking Details:</strong></p>
        <ul>
            <li><strong>Listing:</strong> ${listing.title}</li>
            <li><strong>Check-in Date:</strong> ${new Date(checkin).toISOString().split("T")[0]}</li>
            <li><strong>Check-out Date:</strong> ${new Date(checkout).toISOString().split("T")[0]}</li>
            <li><strong>Guests:</strong> ${guests}</li>
            <li><strong>Total Amount:</strong> ₹${total}</li>
            <li><strong> Your Booking number is ${bookingNumber}<strong><li>

        </ul>
        <p>If you have any questions or need further assistance, feel free to contact us.<a href="http://localhost:8080/show/contact">Contact us<a></p>
        <p>We look forward to hosting you!</p>
        <p>Best regards,</p>
        <p><strong>LuxuryStay</strong></p>
    `;


        await sendMail(req.user.email, "booking verification", msg);



    
              // Create a new booking
              const newBooking = new Booking({
                listing: listingId,
                guest: req.user._id, // Assuming user is authenticated
                checkin: new Date(checkin).toISOString().split("T")[0],
                checkout: new Date(checkout).toISOString().split("T")[0],
                guests,
                total,
                bookingNumber
            });
                     


            const savedBooking = await newBooking.save();
            return res.redirect(`/show/${listingId}/view?message=`+ encodeURIComponent(`Booking confirmed for dates ${checkin} to ${checkout}`));
})

module.exports.ShowBooking = asyncHandler(async(req,res)=>{

    try {
        const { id } = req.params;

        // Fetch all bookings for the listing
        const bookings = await Booking.find({ listing: id }, "checkin checkout");

        // Format the booked dates
        const bookedDates = bookings.map((booking) => ({
            checkin: booking.checkin,
            checkout: booking.checkout,
        }));

        res.json({ success: true, bookedDates });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to fetch booked dates." });
    }

})
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

    // Render the cancel booking page with grouped bookings
    return res.render("cancelBooking.ejs", { groupedBookings, cssFile:"booking.css" });
});

module.exports.BookingCancelConfirm = asyncHandler(async(req,res)=>{
    const { id } = req.params; // Booking ID

    // Find and delete the booking
    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
        return res.status(404).json({
            success: false,
            message: "Booking not found.",
        });
    }

    return res.redirect(`/show?message=` + encodeURIComponent("Booking canceled successfully."));
})