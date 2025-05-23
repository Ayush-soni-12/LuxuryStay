const ExpressError = require("../middlewares/ExpressError.js");

const isAdmin = async (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).redirect("/show?message=" + encodeURIComponent("Access denied. Admin privileges required."));
    }
    next();
};

module.exports = isAdmin;
