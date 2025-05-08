
const mongoose =require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({


    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },

    guest: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the user
        ref: "User",
        required: true,
    },

    bookingNumber:{
        type:Number,
    },
    checkin:{
        type:Date,
        required:true,
    },
    checkout:{
        type:Date,
        required:true,

    },
    guests:{
        type:Number,
        required:true,
    },
    total:{
        type:Number,
        required:true,
    }


});
bookingSchema.index({ listing: 1 });

bookingSchema.index(
    { listing: 1, checkin: 1, checkout: 1 },
    { unique: true }
);



const booking = mongoose.model("Booking",bookingSchema);
module.exports =booking;