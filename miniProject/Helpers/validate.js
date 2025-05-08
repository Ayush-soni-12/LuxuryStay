const { check } = require("express-validator");

module.exports.registerValidator = [
  check("name", "Name is required").not().isEmpty(),
  check("email", "Email is required").isEmail().normalizeEmail({ gmail_remove_dots: true }),
  check("Phone_No", "Phone_No must contain exactly 10 digits").isLength({ min: 10, max: 10 }),
  check("password", "Password must be strong"),
  // .isStrongPassword({
  //   // minLength: 6,
  //   // minLowercase: 2,
  //   // minUppercase: 2,
  //   // minNumbers: 2,
  // }),
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
  check("email", "Email is required").isEmail().normalizeEmail({ gmail_remove_dots: true }),
]
module.exports.passwordResetValidator =[
  check("email", "Email is required").isEmail().normalizeEmail({ gmail_remove_dots: true }),
]
module.exports.userLoginValidator =[
  check("email", "Email is required").isEmail().normalizeEmail({ gmail_remove_dots: true }),
  check("password", "Password must be strong"),
]
module.exports.updateProfileValidator = [
  check("name", "Name is required").not().isEmpty().optional(),
  check("Phone_No", "Phone_No must contain exactly 10 digits").isLength({ min: 10, max: 10 }).optional(),
 
]