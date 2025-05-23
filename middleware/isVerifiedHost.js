const ExpressError = require("../utils/ExpressError.js");

const isVerifiedHost = async (req, res, next) => {
    if (!req.user.isHost || !req.user.hostVerified) {
        return res.redirect("/api/profile?message=" + encodeURIComponent("You must be a verified host to create listings. Please complete host verification first."));
    }
    next();
};

module.exports = isVerifiedHost;
