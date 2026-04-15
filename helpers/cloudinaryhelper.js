const { cloudinary } = require('../config/cloudinary');

/**
 * Deletes an image from Cloudinary by its public_id.
 * The public_id is stored in your DB alongside the image URL.
 */
const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = { deleteImage };