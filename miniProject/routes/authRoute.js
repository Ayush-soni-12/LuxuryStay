const express = require("express");
const router =express();


router.use(express.json());
const {mailVerification,ResetPassword,updatePassword,ResetSuccess} = require("../controllers/userControllers")

router.get("/mailVerification",mailVerification)
router.get("/ResetPassword",ResetPassword)
router.post("/ResetPassword",updatePassword);
router.get("/ResetSuccess",ResetSuccess)



module.exports = router;