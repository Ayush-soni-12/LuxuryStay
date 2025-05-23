const { check } = require("express-validator");

module.exports.registerValidator = [
  check("name", "Name is required").not().isEmpty(),
  check("email", "Email is required").isEmail().normalizeEmail({ gmail_remove_dots: true }),
  check("Phone_No", "Phone_No must contain exactly 10 digits").isLength({ min: 10, max: 10 }),
  check("password", "Password must be strong").isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }),
  check("image").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("Please upload an image");
    }
    if (req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/png") {
      return true;
    } else {
      throw new Error("Only JPEG and PNG images are allowed");
    }
  }).optional(),
];
module.exports.sendMailVerificationValidator =[
   check("email", "Email is required").isEmail() .matches(/^[^@]+@[^@]+\.(com|net|org|in|edu|gov|io|co\.in)$/i)
  .withMessage("Please enter a valid email address with a common domain").normalizeEmail({ gmail_remove_dots: true }),
]
module.exports.passwordResetValidator =[
  check("email", "Email is required").isEmail() .matches(/^[^@]+@[^@]+\.(com|net|org|in|edu|gov|io|co\.in)$/i)
  .withMessage("Please enter a valid email address with a common domain").normalizeEmail({ gmail_remove_dots: true }),
]
module.exports.userLoginValidator =[
 check("email", "Email is required").isEmail() .matches(/^[^@]+@[^@]+\.(com|net|org|in|edu|gov|io|co\.in)$/i)
  .withMessage("Please enter a valid email address with a common domain").normalizeEmail({ gmail_remove_dots: true }),
  check("password", "Enter your password").not().isEmpty(),
]
module.exports.updateProfileValidator = [
  check("name", "Name is required").not().isEmpty().optional(),
  check("Phone_No", "Phone_No must contain exactly 10 digits").isLength({ min: 10, max: 10 }).optional(),
 
]
module.exports.updatePasswordValidator = [
  check("password", "Password must be strong")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    }),
];