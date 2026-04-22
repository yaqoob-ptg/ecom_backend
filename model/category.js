const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
        // adminId:{
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'User', // This should match the model name you use when you create the User model
        //     required: [true, 'Admin ID is required']
        // },
    
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
