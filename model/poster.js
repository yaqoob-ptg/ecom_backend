const mongoose = require('mongoose');

const posterSchema = new mongoose.Schema({
  posterName: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  }, 
  publicId: {          // ← added for Cloudinary deletion
        type: String,
    }
}, {
  timestamps: true 
});

const Poster = mongoose.model('Poster', posterSchema);

module.exports = Poster;
