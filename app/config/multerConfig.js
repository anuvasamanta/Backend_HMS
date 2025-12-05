const multer = require('multer');
const { storage } = require('./cloudinaryConfig');

// Simple configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
  // Remove fileFilter temporarily for testing
});

console.log('✅ Multer configured with Cloudinary storage');

module.exports = upload;