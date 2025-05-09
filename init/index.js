const mongoose =require("mongoose");
const initData = require("./data.js");
const Listing = require("../Modals/listing.js");
const Mongoose_Url = "mongodb://root:example@localhost:27017/wanderlust?authSource=admin";
async function main(){
     await mongoose.connect(Mongoose_Url);   
}
main().then((res)=>{
console.log(`connected to db `);
}).catch((err)=>{
    console.log(`server error ${err}`);
});

const initDB =async()=>{
     await Listing.deleteMany({});
     initData.data =   initData.data.map((obj)=>({...obj ,owner:"67ff416484721301628e1a47"}))
     await Listing.insertMany(initData.data)
     console.log("data was initialized");
}
initDB();
