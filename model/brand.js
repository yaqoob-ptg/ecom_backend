const mongoose = require('mongoose');

// Define the Brand schema
const brandSchema = new mongoose.Schema({
    adminId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // This should match the model name you use when you create the User model
        required: [true, 'Admin ID is required']
    },

    name: {
        type: String,
        required: [true, 'Name is required'], // Adding custom error message
        trim: true
    },
    subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory', // This should match the model name you use when you create the SubCategory model
        required: [true, 'Subcategory ID is required']
    }
},{ timestamps: true });

// Create the Brand model
const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
