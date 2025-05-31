const Listing = require("./Modals/listing");
const Review = require("./Modals/review");
const {listingSchema} = require("./schema");
const {reviewSchema} = require("./schema");
const ExpressError = require("./utils/ExpressError");
const { cloudinary } = require("./CloudConfig");

module.exports.isOwner = async (req, res, next) => {
    try {
      const listing = await Listing.findById(req.params.id);
  
      // Check if the listing exists
      if (!listing) {
        return res.status(404).send('Listing not found');
      }
  
      // Check if the current user is the owner of the listing
      if (!listing.owner.equals(req.user._id)) {
        return res.status(403).send('You do not have permission to perform this action');
      }
  
      next();
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  };
module.exports.validatelisting = (req, res, next) => {
    console.log("Validating listing...");
    const { error } = listingSchema.validate(req.body);
    if (error) {
        console.log("Validation Error Details:", error.details); // Log the error details
        const errMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    } else {
        console.log("Validation Passed");
        next();
    }
};
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};
module.exports.isreviewAuthor =async (req,res,next)=>{
    let {reviewId ,id }= req.params;
    let review = await Review.findById(reviewId);
    if(!review.author.equals(req.user._id)){
        // req.flash("error","You are not the owner of this listing");
        
        return res.redirect(`/show/${id}/view`);
    }
    next();
}

    module.exports.enforceFiveImages = async (req, res, next) => {
    if (!req.files || req.files.length !== 5) {
        // Delete any uploaded files from Cloudinary
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                if (file.filename) {
                    await cloudinary.uploader.destroy(file.filename);
                }
            }
        }
        return res.redirect("/show/new?message=" + encodeURIComponent("Please upload exactly 5 images."));
    }
    next();
};

