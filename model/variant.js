const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({    adminId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // This should match the model name you use when you create the User model
        required: [true, 'Admin ID is required']
    },

    name: {
        type: String,
        required: true
    },
    variantTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VariantType',
        required: true
    }
},{ timestamps: true });

module.exports = mongoose.model('Variant', variantSchema);
