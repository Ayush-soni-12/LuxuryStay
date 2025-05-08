class ExpressError extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent class (Error) constructor
        this.statusCode = statusCode; // Add a custom status code property
    }
}

module.exports = ExpressError;