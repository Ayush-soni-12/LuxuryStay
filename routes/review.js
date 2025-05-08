const express = require("express");
const router = express.Router({ mergeParams: true });
const Review = require("../Modals/review.js");
const Listing = require("../Modals/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schema.js");
const validToken = require("../miniProject/middlewares/validateToken.js")
const { validateReview ,isreviewAuthor } = require("../middleware.js");
const reviewcontrollers = require("../controllers/review.js")

// ................. Reviews ..............................

router.post("/", validToken, validateReview, wrapAsync(reviewcontrollers.createReview));

// ..............................delete review route ...............................

router.delete("/:reviewId", validToken, isreviewAuthor, wrapAsync(reviewcontrollers.deleteReview));

module.exports = router;