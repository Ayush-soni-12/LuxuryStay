const ExpressError = require("../utils/ExpressError");

module.exports = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.redirect("/show?message=" + encodeURIComponent("You must be an administrator to access this page."));
    }
    next();
};
