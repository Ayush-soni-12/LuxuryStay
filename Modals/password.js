const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Token expires in 1 hour
    }
});

passwordResetSchema.index({token:1})
passwordResetSchema.index({user_id:1});

module.exports = mongoose.model("PasswordReset", passwordResetSchema);
