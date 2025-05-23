const Joi = require("joi");

const listingSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(500).max(1000000), // Price between 500 and 1,000,000
    image: Joi.string().allow("", null),
    category: Joi.string()
    .valid('trending', 'room', 'mountain', 'cities', 'castles', 'pool', 'snow', 'camping')
    .required(),
    totalRooms: Joi.number().required().min(10).max(100).required(), // At least 1 room
});


const reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().required()
    }).required()
});

module.exports = { listingSchema, reviewSchema };