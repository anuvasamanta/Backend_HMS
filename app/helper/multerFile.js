const multer = require("multer")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads'); // Save images in the '/uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use a original filename
    }
});

const upload = multer({ storage: storage })

module.exports = upload