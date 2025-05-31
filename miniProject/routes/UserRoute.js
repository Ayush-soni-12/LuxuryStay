const express = require("express");
const router = express();
const User = require("../../Modals/user.js");

router.use(express.json());
const path = require("path");
const multer =  require("multer");
const {userSignup,userRegister,sendMailAgain,forgotpassword,passwordReset,loginPage,userLogin ,userLogout,userProfile,editProfile,updateProfile,verifyOtp, resendOtp,Booking,ShowBooking,CancelBooking,BookingCancelConfirm,becomeHost,getHostStatus,getHostApplications,verifyHost,rejectHost,Profile} = require("../controllers/userControllers")
const {registerValidator,sendMailVerificationValidator,passwordResetValidator,userLoginValidator,updateProfileValidator} = require("../Helpers/validate.js")
const { validationResult } = require("express-validator");
const validToken= require("../middlewares/validateToken.js");
const isAdmin = require("../middlewares/isAdmin.js");
const {deleteFile} = require("../Helpers/deleteFile.js")
const {otpLimiter,loginLimiter} = require("../middlewares/rateLimiter.js");
const {cloudinary} = require("../../CloudConfig.js");
const {storage} = require("../../CloudConfig.js");
const multerUpload = multer({ storage });
const ExpressError = require("../middlewares/ExpressError.js");


function setUserFolder(req, res, next) {
    req.cloudinaryFolder = "Users";
    next();
}

//...............................Signup route ...............................

router.get("/signup",userSignup)

router.post("/signup",setUserFolder, multerUpload.single("image"), registerValidator, async (req, res, next) => {
    const errors = validationResult(req);

    // If validation fails, delete the uploaded image
    if (!errors.isEmpty()) {
        if (req.file) {
            const imagePath = path.join(__dirname, "../public/images", req.file.filename);
             deleteFile(imagePath)
        }
return      res.status(400).redirect(`/api/signup?message=`+encodeURIComponent("Password must be strong"))
    }

    // Proceed to the next middleware if validation passes
    next();
}, userRegister);


//...............................Send mail route ...............................

router.post("/sendMailAgain", sendMailVerificationValidator,  (req,res,next)=>{
const errors =validationResult(req);
if(!errors.isEmpty()){
    return res.status(400).json({success:false,errors:errors.array()})
}
next();
},sendMailAgain)

//...............................Forgot password route ...............................

router.get("/forgotPassword",forgotpassword)

router.post("/forgotPassword",passwordResetValidator,(req,res,next)=>{
    const errors =validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({success:false,errors:errors.array()})
    }
    next();
},passwordReset)

//...............................Login route ...............................

router.get("/login",loginPage)

router.post("/login",loginLimiter,userLoginValidator,(req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({success:false,error:errors.array()})
    }
    next();
},userLogin)

//...............................Logout route ...............................
router.get("/logout",validToken,userLogout)

//...............................OTP route ...............................

router.post("/verify-otp",otpLimiter,verifyOtp);
router.post("/resend-otp",otpLimiter,resendOtp)


//...............................Profile route ...............................

router.get("/profile",validToken,userProfile)
router.get("/updateProfile",validToken,editProfile)
router.post("/updateProfile",setUserFolder,multerUpload.single("image") ,validToken,updateProfileValidator,(req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({success:false,error:errors.array()})
    }
    next();
} ,updateProfile)

//...............................Booking route ...............................

router.post("/booking/:listingId",validToken,Booking)
// router.get("/listing/:id/booked-dates",validToken,ShowBooking)
router.get("/booking/cancel",validToken,CancelBooking)
router.post("/booking/:id/cancel",validToken,BookingCancelConfirm)

//...............................Host route ...............................

router.post("/become-host", validToken, multerUpload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 }
]), becomeHost);

router.get("/host-status", validToken, getHostStatus);

//...............................Admin Host Management Routes ...............................

router.get("/admin/dashboard", validToken, isAdmin, async (req, res, next) => {
    try {
        const pendingHosts = await User.find({ 
            isHost: true, 
            hostVerified: false 
        }).select('name email hostApplicationDate hostVerificationDocuments');
        
        res.render("adminDashboard", { 
            pendingHosts,
            message: req.query.message || null,
            cssFile: 'adminDashboard.css',
            currentUser: req.user // Make sure currentUser is available in the template
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        next(error);
    }
});

router.get("/admin/host-applications", validToken, isAdmin, getHostApplications);
router.post("/admin/verify-host/:userId", validToken, isAdmin, verifyHost);
router.post("/admin/reject-host/:userId", validToken, isAdmin, rejectHost);
router.get("/user/profile/:userId",validToken,Profile)



module.exports = router;