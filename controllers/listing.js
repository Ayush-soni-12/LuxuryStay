const Listing = require("../Modals/listing");
const redis = require("../utils/ioredisClient");
const { logWithUser } = require("../miniProject/utils/logger");
const { cloudinary } = require("../CloudConfig");

module.exports.index = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8; 
        const skip = (page - 1) * limit;

 
        const totalListings = await Listing.countDocuments();
        const totalPages = Math.ceil(totalListings / limit);

        // Get paginated listings
        const datas = await Listing.find({})
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.render("show.ejs", {
            datas,
            currentPage: page,
            totalPages,
            message: req.query.message || null
        });
    } catch (error) {
        console.error(error);
        res.redirect("/?message=" + encodeURIComponent("Error loading listings"));
    }
};









module.exports.new = (req, res) => {
  logWithUser(req, 'info', 'Accessed new listing form');
  res.render("new.ejs", { cssFile: 'new.css',message: req.query.message || null });
};

module.exports.newListing = async (req, res, next) => {
  let { title, description, price, totalRooms, country, location, category } = req.body;

  if (!req.files || req.files.length < 5) {
    logWithUser(req, 'warn', 'Tried to create listing with less than 5 images');

    return res.redirect("/show/new?message=" + encodeURIComponent("Please upload at least 5 images."));
  }

  const imageUrls = req.files.map(file => ({
    url: file.path,
    filename: file.filename,
  }));

  let newListing = new Listing({
    title, description, price, totalRooms, location, country, category, image: imageUrls,
  });

  newListing.owner = req.user._id;
  await newListing.save();

  const cacheKey = `search:listings:${location.toLowerCase()}`;
  await redis.del(cacheKey);

  logWithUser(req, 'info', `New listing created in ${location}`);
  res.redirect("/show?message=" + encodeURIComponent("New listing added"));
};

module.exports.detail = async (req, res) => {
  let { id } = req.params;
  try {
    let detail = await Listing.findById(id)
      .populate("recentReviews")
      .populate({
        path: "recentReviews",
        populate: {
          path: "author",
          model: "User",
        },
      })
      .populate("owner");

    if (!detail) {
      logWithUser(req, 'warn', `Listing detail not found for ID: ${id}`);
      return res.redirect("/show");
    }

    detail.recentReviews = detail.recentReviews.filter((recentReviews) => recentReviews.author);
    const ownerExists = detail.owner !== null;

    logWithUser(req, 'info', `Viewed detail page for listing: ${id}`);
    res.render("detail.ejs", {
      detail,
      cssFile: 'detail.css',
      currentUser: req.user || null,
      ownerExists,
      message: req.query.message || null,
    });
  } catch (err) {
    logWithUser(req, 'error', `Error fetching listing: ${err.message}`);
    res.redirect("/show?message=" + encodeURIComponent("An error occurred while fetching the listing."));
  }
};

module.exports.edit = async (req, res) => {
  let { id } = req.params;
  let data = await Listing.findById(id);
  if (!data) {
    logWithUser(req, 'warn', `Edit attempted on non-existent listing: ${id}`);
    return res.redirect("/show");
  }


  logWithUser(req, 'info', `Accessed edit form for listing: ${id}`);
  res.render("edit.ejs", { cssFile: 'edit.css', data ,message: req.query.message || null});
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let { title, description, totalRooms,category, price, country, location } = req.body;
          if (!req.files || req.files.length !== 5) {
       if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                if (file.filename) {
                    await cloudinary.uploader.destroy(file.filename);
                }
            }
            return res.redirect(`/show/${id}/edit?message=`+ encodeURIComponent("Please update all images ."));
        }
      }

  let updateDetail = await Listing.findByIdAndUpdate(
    id,
    { title, description,totalRooms,category, price, country, location },
    { runValidators: true, new: true }
  );

  if (!updateDetail) {
    logWithUser(req, 'warn', `Attempted to update non-existent listing: ${id}`);
    return res.redirect(`/show/${id}/view?message=` + encodeURIComponent("listing not found"));
  }

  const cacheKey = `search:listings:${location.toLowerCase()}`;
  await redis.del(cacheKey);

  if (req.files && req.files.length === 5) {
    // (Optional) Delete old images from Cloudinary
    if (Array.isArray(updateDetail.image)) {
      for (const img of updateDetail.image) {
        if (img.filename) {
          await cloudinary.uploader.destroy(img.filename);
        }
      }
    }
    // Save new images
    const imageUrls = req.files.map(file => ({
      url: file.path,
      filename: file.filename,
    }));
    updateDetail.image = imageUrls;
    await updateDetail.save();
  }


  logWithUser(req, 'info', `Listing updated: ${id}`);
  res.redirect(`/show/${id}/view?message=` + encodeURIComponent("listing updated"));
};

module.exports.delete = async (req, res) => {
  let { id, location } = req.params;
  let deleteDetail = await Listing.findByIdAndDelete(id);

    if (deleteDetail && Array.isArray(deleteDetail.image)) {
    for (const img of deleteDetail.image) {
      if (img.filename) {
        await cloudinary.uploader.destroy(img.filename);
      }
    }
  }
  const cacheKey = `search:listings:${location.toLowerCase()}`;
  await redis.del(cacheKey);

  logWithUser(req, 'info', `Listing deleted: ${id} in ${location}`);
  return res.redirect("/show?message=" + encodeURIComponent("listing deleted"));
};






module.exports.filters = async (req, res) => {
  try {
    const { category } = req.params;
    

    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;


    const totalListings = await Listing.countDocuments({ category });
    const totalPages = Math.ceil(totalListings / limit);

    const datas = await Listing.find({ category })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (datas.length === 0) {
      logWithUser(req, 'info', `No listings found for category: ${category}`);
      return res.render('show.ejs', {
        datas: [],
        currentPage: 1,
        totalPages: 0,
        totalListings: 0,
        message: `No listings found for "${category} category".`
      });
    }

    logWithUser(req, 'info', `Filtered listings by category: ${category}`);
    res.render('show.ejs', {
      datas,
      currentPage: page,
      totalPages,
      totalListings,
      message: `Showing results for "${category} category".`
    });
  } catch (err) {
    logWithUser(req, 'error', `Error in filter: ${err.message}`);
    res.redirect("/show?message=" + encodeURIComponent("Error applying filters"));
  }
};


module.exports.search = async (req, res) => {
  let { location } = req.query;
  if (!location) {
    logWithUser(req, 'warn', 'Search attempted with empty location');
    return res.redirect("/show");
  }

  try {
    // Add pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = 8; // listings per page
    const skip = (page - 1) * limit;

    location = String(location || '').trim();
    const cacheKey = `search:listings:${location.toLowerCase()}`;

    let datas;
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      logWithUser(req, 'info', `Cache HIT for location: ${location}`);
      const allData = JSON.parse(cachedData);
      

      const totalListings = allData.length;
      const totalPages = Math.ceil(totalListings / limit);
      
      
      datas = allData.slice(skip, skip + limit);

      return res.render('show.ejs', {
        datas,
        currentPage: page,
        totalPages,
        totalListings,
        message: `Showing cached results for "${location}".`
      });
    }


    const totalListings = await Listing.countDocuments({
      location: { $regex: location, $options: 'i' }
    });
    const totalPages = Math.ceil(totalListings / limit);

    datas = await Listing.find({
      location: { $regex: location, $options: 'i' }
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (datas.length === 0) {
      logWithUser(req, 'info', `No listings found for location: ${location}`);
      return res.render('show.ejs', {
        datas: [],
        currentPage: 1,
        totalPages: 0,
        totalListings: 0,
        message: `No listings found for "${location}".`
      });
    }

  
    const allResults = await Listing.find({
      location: { $regex: location, $options: 'i' }
    });
    await redis.set(cacheKey, JSON.stringify(allResults), 'EX', 3600);

    logWithUser(req, 'info', `Cache MISS — MongoDB queried for ${location}`);
    res.render('show.ejs', {
      datas,
      currentPage: page,
      totalPages,
      totalListings,
      message: `Showing results for "${location}".`
    });

  } catch (err) {
    logWithUser(req, 'error', `Error during search: ${err.message}`);
    res.redirect("/show?message=" + encodeURIComponent("Error performing search"));
  }
};














module.exports.contact = async (req, res) => {
  logWithUser(req, 'info', 'Accessed contact page');
  return res.render("contact.ejs",{message: req.query.message || null,});
};

module.exports.showProperty = async (req, res) => {
  let userId = req.user.id;
  let properties = await Listing.find({ owner: userId });

  if (!properties || properties.length === 0) {
    logWithUser(req, 'info', 'User has no property listings');
    return res.redirect("/show?message=" + encodeURIComponent("No property found"));
  }

  logWithUser(req, 'info', 'Viewed user properties');
  return res.render("property.ejs", {
    cssFile: "property.css",
    properties,
    message: req.query.message || null
  });
};
