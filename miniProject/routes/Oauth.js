const express = require("express");

const router =express.Router();

const { googleAuth,googleOauth} = require("../controllers/userControllers")

// Google OAuth routes

router.get("/auth/google",googleAuth)
router.get("/auth/google/callback",googleOauth)
  

module.exports  = router;