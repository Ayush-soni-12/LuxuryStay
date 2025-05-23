require("dotenv").config();
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../Modals/listing.js");

// MongoDB connection URL
const Mongoose_Url = "mongodb://wanderlust:test123@localhost:27017/wanderlust?authSource=admin";

// Function to initialize the database
const initDB = async () => {
  try {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({
      ...obj,
      owner: "67ff416484721301628e1a47",
    }));
    await Listing.insertMany(initData.data);
    console.log("Data was initialized");
  } catch (err) {
    console.error("Error during DB initialization:", err);
  }
};

// Retry mechanism for MongoDB connection
async function connectWithRetry() {
  let retries = 10;
  while (retries) {
    try {
      await mongoose.connect(Mongoose_Url, {
        tls: true,
        tlsCAFile: process.env.MONGO_CA_PATH,
        tlsCertificateKeyFile: process.env.MONGO_CERT_PATH,
          tlsAllowInvalidHostnames: true,
      });
      console.log("Connected to MajorProject DB");

      // Call initDB after successful connection
      await initDB();
      return;
    } catch (err) {
      console.log("MongoDB not ready, retrying in 5s...", err.message);
      retries -= 1;
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
  throw new Error("Could not connect to MongoDB after several retries.");
}

// Start connection
connectWithRetry();
