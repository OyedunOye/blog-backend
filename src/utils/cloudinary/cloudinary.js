// Require the cloudinary library
const cloudinary = require('cloudinary').v2;
// const config = require('../config')


const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Return "https" URLs by setting secure: true
cloudinary.config({
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "Shade_Blog_Images",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    };
  }
});

module.exports = {
  cloudinary,
  storage,
};
