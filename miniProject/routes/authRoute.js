const express = require("express");
const router =express();


router.use(express.json());
const {mailVerification,ResetPassword,updatePassword,ResetSuccess} = require("../controllers/userControllers")
const {updatePasswordValidator} = require("../Helpers/validate.js")


//...............................Mail verification route ...............................

router.get("/mailVerification",mailVerification)

//...............................Reset password route ...............................

router.get("/ResetPassword",ResetPassword)
router.post("/ResetPassword" ,updatePassword);

//...............................Reset success route ...............................

router.get("/ResetSuccess",ResetSuccess)



module.exports = router;