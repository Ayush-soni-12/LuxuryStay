
const Review = require("../Modals/review.js");
const Listing = require("../Modals/listing.js");


module.exports.createReview = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);


    listing.recentReviews.unshift(newReview._id);  // Add to the beginning of the array
    if (listing.recentReviews.length > 5) {
      listing.recentReviews.pop(); // Remove the oldest review if we have more than 3
    }
  

    await newReview.save();
    await listing.save();
    res.redirect(`/show/${id}/view?message=`+ encodeURIComponent("New Review added"));
};
module.exports.deleteReview = async (req, res) => {
    let { id, reviewId } = req.params;

    try {
        // Find the listing and make sure it exists
        let listing = await Listing.findById(id);
        if (!listing) {
            return res.redirect(`/show?message=` + encodeURIComponent("Listing not found"));
        }

        // Manually remove the review from the `reviews` array
        console.log('Before:', listing.reviews);
        listing.reviews.pull(reviewId);
        console.log('After:', listing.reviews);
        listing.recentReviews.pull(reviewId);  // Also remove from recentReviews if needed


        // Save the updated listing document
        await listing.save();

        // Delete the review from the Review collection
        await Review.findByIdAndDelete(reviewId);

        // Redirect with success message
        res.redirect(`/show/${id}/view?message=` + encodeURIComponent("Review deleted"));

    } catch (err) {
        console.error(err);
        res.redirect(`/show/${id}/view?message=` + encodeURIComponent("Error deleting review"));
    }
};
