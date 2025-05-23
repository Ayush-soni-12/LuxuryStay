const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
    windowMs: 10*60*1000,
    max:100,
    standardHeaders:true,
    legacyHeaders:false,
    handler: (req, res, next, options) => {
        res.status(429).json({
            success: false,
            message: "Too many requests from this IP, please try again after 10 minutes",
        });
    },
});


const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 5, 
    handler: (req, res, next, options) => {
   return res.redirect("/api/login?message=" + encodeURIComponent("Too many login attempts. Please try again after 10 minutes."));
    },

});

const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    max: 3, 
    handler: (req, res, next, options) => {
        return res.redirect("/api/login?message=" + encodeURIComponent("Too many OTP requests. Please try again after 5 minutes."));
    },
  
});


module.exports = { globalLimiter, loginLimiter,otpLimiter}