const mongoose = require('mongoose');

// Define the Notification schema
const notificationSchema = new mongoose.Schema({    adminId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // This should match the model name you use when you create the User model
        required: [true, 'Admin ID is required']
    },

    notificationId: {
        type: String,
        required: [true, 'Notification ID is required'],
        unique: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    imageUrl: {
        type: String,
        trim: true
    },
}, { timestamps: true });

// Create the Notification model
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
