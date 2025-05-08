const Joi = require("joi");

const listingSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(0),
    image: Joi.string().allow("", null),
    category: Joi.string()
    .valid('trending', 'room', 'mountain', 'cities', 'castles', 'pool', 'snow', 'camping')
    .required()
    // image: Joi.object({
    //     url: Joi.string().uri().required(),
    //     filename: Joi.string().required(),
    // }).required(),
});


const reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().required()
    }).required()
});

module.exports = { listingSchema, reviewSchema };