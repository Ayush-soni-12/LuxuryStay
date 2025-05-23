const express = require("express");
const router = express.Router();
const axios = require("axios")
const Listing = require("../Modals/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schema.js");
const { reviewSchema } = require("../schema.js");
const validToken = require("../miniProject/middlewares/validateToken.js");
const isVerifiedHost = require("../middleware/isVerifiedHost.js");
const {  isOwner, validatelisting,enforceFiveImages ,updateFiveImage} = require("../middleware.js");
const listingcontrollers = require("../controllers/listing.js");
const multer = require("multer");
const {storage} = require("../CloudConfig.js");
const upload = multer({storage});
router.route("/")
    .get(wrapAsync(listingcontrollers.index))
    .post(
        validToken,
        isVerifiedHost,
        upload.array('image[]',5),
        enforceFiveImages,
        validatelisting,
        listingcontrollers.newListing
    );

// ..................................new route ....................................

router.get("/new",validToken, listingcontrollers.new);


//............................... specific filter .............................

router.get('/filters/:category', validToken ,wrapAsync(listingcontrollers.filters))


// .................................. searching route ...........................................
router.get("/search",validToken,wrapAsync(listingcontrollers.search))


// ............................... Detail route .......................... 

router.get("/:id/view",validToken, wrapAsync(listingcontrollers.detail));

// ..................................Edit route ............................

router.get("/:id/edit", validToken, isOwner, wrapAsync(listingcontrollers.edit));

// ..................................Update and Delete routes ............................

router.route("/:id/:location")
    .put(
        validToken,
        isOwner,
         upload.array("image[]", 5),
        //  updateFiveImage,
        validatelisting,
        wrapAsync(listingcontrollers.updateListing)
    )
    .delete(
        validToken,
        isOwner,
        wrapAsync(listingcontrollers.delete)
    );

    // .................................. chatBot route ............................

router.get("/api",validToken,wrapAsync(listingcontrollers.chatbot))
router.post("/chat",validToken,wrapAsync(listingcontrollers.gpt))

// .................................. contact route ............................
router.get("/contact",wrapAsync(listingcontrollers.contact))

// .................................. show property  route ............................
router.get("/property",validToken, wrapAsync(listingcontrollers.showProperty))




module.exports = router;