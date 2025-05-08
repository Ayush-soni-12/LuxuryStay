 const Listing = require("../Modals/listing");
 const redis = require("../utils/ioredisClient")


module.exports.index =async (req, res) => {
    let datas = await Listing.find()
    res.render("index.ejs", {cssFile: 'index.css', datas,    currentUser: req.user || null ,message:req.query.message || null});
};
module.exports.new = (req, res) => {
    res.render("new.ejs",{cssFile:'new.css'});
}
module.exports.newListing = async(req, res, next) => {

let { title, description,  price, country, location ,category} = req.body;
// let url = req.file.path;
// let filename = req.file.filename;
console.log(req.files)

if (!req.files || req.files.length < 5) {
  return res.status(400).send("Please upload at least 5 images.");
}

const imageUrls = req.files.map(file => ({
  url: file.path,
  filename: file.filename,
}));


    console.log("hello");
    let newListing = new Listing({
        title: title,
        description: description,
        price: price,
        location: location,
        country: country,
        category:category,
        image:imageUrls,

    });
    newListing.owner = req.user._id;
    // newListing.image = { url, filename };

    await newListing.save();

    const cacheKey = `search:listings:${location.toLowerCase()}`;
   const result =  await redis.del(cacheKey); // Delete the old cached data
   console.log(result);
 
    res.redirect("/show?message="+encodeURIComponent("New listing added"));
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
            return res.redirect("/show");
        }

        // Filter out reviews with missing authors
        detail.reviews = detail.reviews.filter((review) => review.author);

        const ownerExists = detail.owner !== null;

        res.render("detail.ejs", {
            detail,
            cssFile: 'detail.css',
            currentUser: req.user || null,
            ownerExists,
            message: req.query.message || null,
        });
    } catch (err) {
        console.error(err);
        res.redirect("/show?message=" + encodeURIComponent("An error occurred while fetching the listing."));
    }
};
module.exports.edit = async (req, res) => {
    let { id } = req.params;
    let data = await Listing.findById(id);
    if(!data){
        res.redirect("/show");
       }
       let originalImageUrl = data.image.url;
      originalImageUrl =  originalImageUrl.replace("/upload", "/upload/w_200,e_blur:100");
    res.render("edit.ejs", { cssFile: 'edit.css',data ,originalImageUrl});
};
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let { title, description, image, price, country, location } = req.body;
    let updateDetail = await Listing.findByIdAndUpdate(
        id,
        { title, description,  price, country, location },
        { runValidators: true, new: true }
    );
    if(!updateDetail){
      return  res.redirect(`/show/${id}/view?message=`+encodeURIComponent("listing not found"));
    }

    const cacheKey = `search:listings:${location.toLowerCase()}`;
    await redis.del(cacheKey); // Delete the cached data for that location



    if(typeof req.file !== "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    updateDetail.image = {url, filename};
    await updateDetail.save();
    }
    res.redirect(`/show/${id}/view?message=`+encodeURIComponent("listing updated"));
};
module.exports.delete = async (req, res) => {
    let { id ,location} = req.params;
    let deleteDetail = await Listing.findByIdAndDelete(id);
    // if(!deleteDetail){
    //    return res.redirect(`/show/${id}/view?message=`+encodeURIComponent("listing not found"));
    // }
    const cacheKey = `search:listings:${location.toLowerCase()}`;
    await redis.del(cacheKey); // Delete the old cached data
  return  res.redirect("/show?message="+encodeURIComponent("listing deleted"));
}

module.exports.filters = async (req,res)=>{
    try {
        const { category } = req.params;
        const datas = await Listing.find({ category });
        
    if (datas.length === 0) {
        return res.render('index.ejs', {
          cssFile: 'index.css',
          datas: [],
          message: `No listings found for "${category} category".`,
        });
      }
      res.render('index.ejs', {
        cssFile: 'index.css',
        datas,
        message: `Showing results for "${category} category".`,
      });
      } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
      }
}



module.exports.search = async (req, res) => {
  let { location } = req.query;

  if (!location) {
    return res.redirect("/show");
  }

  // Normalize location
  location = String(location || '').trim();

  // Define Redis cache key
  const cacheKey = `search:listings:${location.toLowerCase()}`;

  try {
    // 1. Try getting cached data
    const cachedData = await redis.get(cacheKey);
    // console.log(cachedData);

    if (cachedData) {
      console.log('✅ Cache HIT');
      const datas = JSON.parse(cachedData);

      return res.render('index.ejs', {
        cssFile: 'index.css',
        datas,
        message: `Showing cached results for "${location}".`,
      });
    }

    // 2. If not cached, query MongoDB
    const datas = await Listing.find({
      location: { $regex: location, $options: 'i' }
    });


    // const datas = await Listing.createIndexes({location:1})

    // 3. If no results
    if (datas.length === 0) {
      return res.render('index.ejs', {
        cssFile: 'index.css',
        datas: [],
        message: `No listings found for "${location}".`,
      });
    }

    // 4. Store results in Redis (expire in 1 hour)
    const result = await redis.set(cacheKey, JSON.stringify(datas), 'EX', 3600); // 1 hour
    // console.log(result);

    console.log('❌ Cache MISS — MongoDB queried');
    res.render('index.ejs', {
      cssFile: 'index.css',
      datas,
      message: `Showing results for "${location}".`,
    });

  } catch (err) {
    console.error('Error during search:', err);
    res.status(500).send('Internal Server Error');
  }
};


module.exports.contact = async(req,res)=>{
     return res.render("contact.ejs");
}


module.exports.profile = async(req,res)=>{
    return res.render("guest.ejs")
}