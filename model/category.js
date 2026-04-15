const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { 
        type: String, required: true 
    },
    image: { 
        type: String, required: true 
    },
    publicId: {          // ← added for Cloudinary deletion
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
