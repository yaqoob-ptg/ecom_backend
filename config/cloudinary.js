const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// // Storage for product images
// const productStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: 'products',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
//     transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
//   },
// });

// // Storage for category images
// const categoryStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: 'categories',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
//     transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
//   },
// });

// // Storage for poster images
// const posterStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: 'posters',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
//     transformation: [{ width: 1200, height: 600, crop: 'limit', quality: 'auto' }],
//   },
// });


module.exports =  cloudinary ;