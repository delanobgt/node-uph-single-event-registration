let multer = require('multer')
let storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
})
let imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false)
  }
  cb(null, true)
};
let upload = multer({
  storage: storage,
  fileFilter: imageFilter
})

let cloudinary = require('cloudinary')
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

module.exports = upload