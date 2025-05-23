const Listing = require("../Modals/listing");
const Booking = require("../Modals/booking");

module.exports = async (req, res, next) => {
    try {
        if (req.user) {
            // Get listing count for the user
            const listingCount = await Listing.countDocuments({ owner: req.user._id });
            
            // Get booking count for the user
            const bookingCount = await Booking.countDocuments({ guest: req.user._id });
            
            // Add these stats to the user object
            req.user.listingCount = listingCount;
            req.user.bookingCount = bookingCount;
        }
        next();
    } catch (err) {
        console.error('Error getting user stats:', err);
        next();
    }
};
