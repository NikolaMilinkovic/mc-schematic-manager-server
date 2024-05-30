const cloudinary = require('cloudinary').v2;
require('dotenv').config();
          
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});
const removeFromCloudinary = async (publicId) => {
  try{
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch(err){
    console.log(err)
    throw(err)
  }
}


const uploadToCloudinary = async (path, folder = "mc-schematic-manager-images") => {
  try {
    const data = await cloudinary.uploader.upload(path, { folder: folder });
    return { url: data.secure_url, publicId: data.public_id };
  } catch (err) {
    console.log(err);
    throw err;
  }
};
module.exports = { uploadToCloudinary, removeFromCloudinary }