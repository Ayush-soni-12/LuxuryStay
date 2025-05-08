const express = require("express");
const router =express();


router.use(express.json());
const path = require("path");
const multer =  require("multer");
const {userSignup,userRegister,sendMailAgain,forgotpassword,passwordReset,loginPage,userLogin ,userLogout,userProfile,updateProfile,verifyOtp, resendOtp,Booking,ShowBooking,CancelBooking,BookingCancelConfirm} = require("../controllers/userControllers")
const {registerValidator,sendMailVerificationValidator,passwordResetValidator,userLoginValidator,updateProfileValidator} = require("../Helpers/validate.js")
const { validationResult } = require("express-validator");
const validToken= require("../middlewares/validateToken.js");
const {deleteFile} = require("../Helpers/deleteFile.js")
const {otpLimiter,loginLimiter} = require("../middlewares/rateLimiter.js");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
            cb(null, path.join(__dirname, "../public/images")); // Store images here
        } else {
            cb(new Error("Invalid file type. Only JPEG and PNG are allowed."), false);
        }
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG and PNG images are allowed!"), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });


router.get("/signup",userSignup)

router.post("/signup", upload.single("image"), registerValidator, async (req, res, next) => {
    const errors = validationResult(req);

    // If validation fails, delete the uploaded image
    if (!errors.isEmpty()) {
        if (req.file) {
            const imagePath = path.join(__dirname, "../public/images", req.file.filename);
             deleteFile(imagePath)
        }
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Proceed to the next middleware if validation passes
    next();
}, userRegister);
router.post("/sendMailAgain", sendMailVerificationValidator,  (req,res,next)=>{
const errors =validationResult(req);
if(!errors.isEmpty()){
    return res.status(400).json({success:false,errors:errors.array()})
}
next();
},sendMailAgain)

router.get("/forgotPassword",forgotpassword)

router.post("/forgotPassword",passwordResetValidator,(req,res,next)=>{
    const errors =validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({success:false,errors:errors.array()})
    }
    next();
},passwordReset)

router.get("/login",loginPage)

router.post("/login",loginLimiter,userLoginValidator,(req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({success:false,error:errors.array()})
    }
    next();
},userLogin)
router.get("/logout",userLogout)

router.post("/verify-otp",otpLimiter,verifyOtp);
router.post("/resend-otp",otpLimiter,resendOtp)


router.get("/profile",validToken,userProfile)
router.post("/updateProfile", upload.single("image"),validToken,updateProfileValidator,(req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({success:false,error:errors.array()})
    }
    next();
} ,updateProfile)

router.post("/booking/:listingId",validToken,Booking)
router.get("/listing/:id/booked-dates",validToken,ShowBooking)
router.get("/booking/cancel",validToken,CancelBooking)
router.post("/booking/:id/cancel",validToken,BookingCancelConfirm)



module.exports = router;