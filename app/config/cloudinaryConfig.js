const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'services',
    format: async (req, file) => 'png', // or jpg, jpeg, etc.
    public_id: (req, file) => {
      const timestamp = Date.now();
      return `service-${timestamp}`;
    },
  },
});

module.exports = { cloudinary, storage };