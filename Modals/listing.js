const mongoose =require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js")
const listingSchema = new Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },
  image: [
    {
      url: {
        type: String,
        required: true
      },
      filename: {
        type: String,
        required: true
      }
    }
  ],
  

    price:{
        type:Number,
    },
    location:{
        type:String,
    },
    country:{
        type:String,
    },
    category: {
        type: String,
        // required: true, // Ensure category is mandatory
        enum: ['trending', 'room', 'mountain', 'cities', 'castles', 'pool', 'snow', 'camping'], // Allowed categories
      },


    // reviews:[
    //     {
    //         type:Schema.Types.ObjectId,
    //          ref:"Review",
    //     }
    // ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    recentReviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

});


listingSchema.index({location:1});
listingSchema.index({category:1});

listingSchema.post("findOneAndDelete", async (listing)=>{
   if(listing){
     await Review.deleteMany({_id:{$in :listing.reviews}})
   }

})

listingSchema.pre('save', async function (next) {
  if (this.reviews && this.reviews.length > 0) {
    // Populate the reviews to get the latest ones
    let recentReviews = this.reviews.slice(-5); // Take last 3 reviews
    this.recentReviews = recentReviews; // Update the recent reviews
  }
  next();
});

const Listing = mongoose.model("Listing",listingSchema);
module.exports =Listing;