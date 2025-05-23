const Review = require("../Modals/review.js");
const Listing = require("../Modals/listing.js");
const ListingReviewOutlier = require("../Modals/listingReviewOutlier.js");
const { logWithUser } = require("../miniProject/utils/logger.js");

module.exports.createReview = async (req, res) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      logWithUser(req, 'warn', `Attempted to review a non-existing listing: ${id}`);
      return res.redirect("/show?message=" + encodeURIComponent("Listing not found"));
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    await newReview.save();
    logWithUser(req, 'info', `New review created for listing ${id}`);

    listing.recentReviews.unshift(newReview._id);
    if (listing.recentReviews.length > 5) {
      listing.recentReviews.pop();
    }
    await listing.save();
    logWithUser(req, 'info', `Updated recent reviews for listing ${id}`);

    let outlierDoc = await ListingReviewOutlier.findOne({ listing: id });
    if (!outlierDoc) {
      outlierDoc = new ListingReviewOutlier({ listing: id, reviews: [] });
      logWithUser(req, 'info', `Created new outlier doc for listing ${id}`);
    }
    outlierDoc.reviews.push(newReview._id);
    await outlierDoc.save();
    logWithUser(req, 'info', `Added review ${newReview._id} to outlier doc for listing ${id}`);

    res.redirect(`/show/${id}/view?message=` + encodeURIComponent("New Review added"));
  } catch (err) {
    logWithUser(req, 'error', `Error in createReview: ${err.message}`);
    res.redirect(`/show?message=` + encodeURIComponent("Error adding review"));
  }
};

module.exports.deleteReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, { $pull: { recentReviews: reviewId } });
    logWithUser(req, 'info', `Removed review ${reviewId} from recentReviews of listing ${id}`);

    await ListingReviewOutlier.findOneAndUpdate(
      { listing: id },
      { $pull: { reviews: reviewId } }
    );
    logWithUser(req, 'info', `Removed review ${reviewId} from outlier document for listing ${id}`);

    await Review.findByIdAndDelete(reviewId);
    logWithUser(req, 'info', `Deleted review ${reviewId} from database`);

    const listing = await Listing.findById(id);
    const outlierDoc = await ListingReviewOutlier.findOne({ listing: id }).populate("reviews");

    if (listing.recentReviews.length < 5 && outlierDoc) {
      const remainingReviews = outlierDoc.reviews.filter(
        (review) => !listing.recentReviews.includes(review._id.toString())
      );

      while (listing.recentReviews.length < 5 && remainingReviews.length > 0) {
        const nextReview = remainingReviews.shift();
        listing.recentReviews.push(nextReview._id);
        logWithUser(req, 'info', `Re-added review ${nextReview._id} to recentReviews of listing ${id}`);
      }

      await listing.save();
    }

    res.redirect(`/show/${id}/view?message=${encodeURIComponent("Review deleted")}`);
  } catch (err) {
    logWithUser(req, 'error', `Error in deleteReview: ${err.message}`);
    res.redirect(`/show/${id}/view?message=` + encodeURIComponent("Error deleting review"));
  }
};
