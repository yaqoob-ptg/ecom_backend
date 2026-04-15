// const multer = require('multer');
// const { productStorage, categoryStorage, posterStorage } = require('../config/cloudinary');

// const fileFilter = (req, file, cb) => {
//   const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
//   if (allowed.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
//   }
// };

// const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

// const uploadProduct = multer({ storage: productStorage, fileFilter, limits });
// const uploadCategory = multer({ storage: categoryStorage, fileFilter, limits });
// const uploadPoster   = multer({ storage: posterStorage,   fileFilter, limits });

// module.exports = { uploadProduct, uploadCategory, uploadPoster };


const multer  = require('multer');
const cloudinary = require('../config/cloudinary');

// Use memory storage — no disk writes, buffer goes straight to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
    }
};

const limits = { fileSize: 4 * 1024 * 1024 }; // 4MB

// One multer instance — reuse for products, categories, posters
const upload = multer({ storage, fileFilter, limits });

/**
 * Uploads a single buffer to Cloudinary.
 * @param {Buffer} buffer   - file buffer from multer memoryStorage
 * @param {string} folder   - Cloudinary folder name e.g. 'products'
 * @param {object} options  - extra Cloudinary upload options (optional)
 * @returns {{ url, publicId }}
 */
const uploadToCloudinary = (buffer, folder, options = {}) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                ...options,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });
};

module.exports = { upload, uploadToCloudinary };