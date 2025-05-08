
const Review = require("../Modals/review.js");
const Listing = require("../Modals/listing.js");
const ListingReviewOutlier = require("../Modals/listingReviewOutlier.js")



module.exports.createReview = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    // listing.reviews.push(newReview);
    await newReview.save();


    listing.recentReviews.unshift(newReview._id);  // Add to the beginning of the array
    if (listing.recentReviews.length > 5) {
      listing.recentReviews.pop(); // Remove the oldest review if we have more than 3
    }
  

    // await newReview.save();
    await listing.save();

      // Outlier Pattern - add to separate review collection
  let outlierDoc = await ListingReviewOutlier.findOne({ listing: id });
  if (!outlierDoc) {
    outlierDoc = new ListingReviewOutlier({ listing: id, reviews: [] });
  }
  outlierDoc.reviews.push(newReview._id);
  await outlierDoc.save();
    res.redirect(`/show/${id}/view?message=`+ encodeURIComponent("New Review added"));
};
// module.exports.deleteReview = async (req, res) => {
//     let { id, reviewId } = req.params;

//     try {
//         // Find the listing and make sure it exists
//         let listing = await Listing.findById(id);
//         if (!listing) {
//             return res.redirect(`/show?message=` + encodeURIComponent("Listing not found"));
//         }

//         // Manually remove the review from the `reviews` array
//         console.log('Before:', listing.reviews);
//         listing.reviews.pull(reviewId);
//         console.log('After:', listing.reviews);
//         listing.recentReviews.pull(reviewId);  // Also remove from recentReviews if needed


//         // Save the updated listing document
//         await listing.save();

//         // Delete the review from the Review collection
//         await Review.findByIdAndDelete(reviewId);

//         // Redirect with success message
//         res.redirect(`/show/${id}/view?message=` + encodeURIComponent("Review deleted"));

//     } catch (err) {
//         console.error(err);
//         res.redirect(`/show/${id}/view?message=` + encodeURIComponent("Error deleting review"));
//     }
// };





module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
  
    // Remove the review from recentReviews in the Listing model
    await Listing.findByIdAndUpdate(id, { $pull: { recentReviews: reviewId } });
  
    // Remove the review from the ListingReviewOutlier collection
    await ListingReviewOutlier.findOneAndUpdate({ listing: id }, { $pull: { reviews: reviewId } });
  
    // Delete the review from the Review collection
    await Review.findByIdAndDelete(reviewId);
  
    // Fetch the updated listing and outlier reviews
    const listing = await Listing.findById(id);
    const outlierDoc = await ListingReviewOutlier.findOne({ listing: id }).populate("reviews");
  
    // Ensure recentReviews has at most 5 reviews
    if (listing.recentReviews.length < 5 && outlierDoc) {
      // Find reviews that are not already in recentReviews
      const remainingReviews = outlierDoc.reviews.filter(
        (review) => !listing.recentReviews.includes(review._id.toString())
      );
  
      // Add reviews to recentReviews until it has 5 reviews
      while (listing.recentReviews.length < 5 && remainingReviews.length > 0) {
        listing.recentReviews.push(remainingReviews.shift()._id);
      }
  
      // Save the updated listing
      await listing.save();
    }
  
    // Redirect with a success message
    res.redirect(`/show/${id}/view?message=${encodeURIComponent("Review deleted")}`);
  };
