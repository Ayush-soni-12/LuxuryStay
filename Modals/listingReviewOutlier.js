const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingReviewOutlierSchema = new Schema({
  listing: { type: Schema.Types.ObjectId, ref: "Listing" },
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
});

const ListingReviewOutlier = mongoose.model("ListingReviewOutlier", listingReviewOutlierSchema);
module.exports = ListingReviewOutlier;
