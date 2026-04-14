// const express = require('express');
// const router = express.Router();
// const asyncHandler = require('express-async-handler');
// const Notification = require('../model/notification');
// const OneSignal = require('@onesignal/node-onesignal');
// const dotenv = require('dotenv');
// dotenv.config();


// const configuration = OneSignal.createConfiguration({
//     authMethods: {
//         app_key: {
//             tokenProvider: {
//                 getToken() {
//                     return process.env.ONE_SIGNAL_REST_API_KEY;
//                 }
//             }
//         }
//     }
// });
// const client = new OneSignal.DefaultApi(configuration);
// router.post('/send-notification', asyncHandler(async (req, res) => {
//     const { title, description, imageUrl } = req.body;

//     // logs
//     console.log("App ID:", process.env.ONE_SIGNAL_APP_ID);
//     console.log("API Key exists:", !!process.env.ONE_SIGNAL_REST_API_KEY);
//     console.log("API Key prefix:", process.env.ONE_SIGNAL_REST_API_KEY?.substring(0, 10));
//     console.log("Request body:", { title, description, imageUrl });

//     // The object structure is slightly different now
//     const notificationBody = new OneSignal.Notification();
//     notificationBody.app_id = process.env.ONE_SIGNAL_APP_ID;
//     notificationBody.contents = { 'en': description };
//     notificationBody.headings = { 'en': title };
//     notificationBody.included_segments = ['All'];
    
//     if (imageUrl) {
//         notificationBody.big_picture = imageUrl;
//     }
// try{
//     // Use createNotification instead of body.id
//     const response = await client.createNotification(notificationBody);
//     const notificationId = response.id; // No more .body.id

//     console.log('Notification sent:', notificationId);
    
//     const notification = new Notification({ notificationId, title, description, imageUrl });
//     await notification.save();
    
//     res.json({ success: true, message: 'Notification sent successfully', data: null });

// } catch (error) {
//     let errorData = error.message;
//     if (error.body && typeof error.body.text === 'function') {
//         errorData = await error.body.text();
//     } else if (typeof error.body === 'string') {
//         errorData = error.body;
//     }
//     console.error("OneSignal Full Error:", JSON.stringify(error));
//     console.error("OneSignal Error Body:", errorData);
    
//     res.status(500).json({ 
//         success: false, 
//         message: errorData 
//     });
// }
// }));

// router.get('/track-notification/:id', asyncHandler(async (req, res) => {
//     const notificationId = req.params.id;
// try{
//     // Use getNotification instead of viewNotification
//     const response = await client.getNotification(process.env.ONE_SIGNAL_APP_ID, notificationId);
//     const androidStats = response.platform_delivery_stats;

//     const result = {
//         platform: 'Android',
//         success_delivery: androidStats?.android?.successful || 0,
//         failed_delivery: androidStats?.android?.failed || 0,
//         errored_delivery: androidStats?.android?.errored || 0,
//         opened_notification: androidStats?.android?.converted || 0
//     };
    
//     res.json({ success: true, message: 'success', data: result });
//  } catch (error) {
//     let errorData = error.message;
//         if (error.body && typeof error.body.text === 'function') {
//             errorData = await error.body.text();
//         }
//         console.error("Tracking Error:", error.body || error);
//         res.status(error.code || 500).json({ success: false, message: "Failed to fetch tracking data" });
//     }
// }));


// router.get('/all-notification', asyncHandler(async (req, res) => {
//     try {
//         console.log("App ID:", process.env.ONE_SIGNAL_APP_ID)
//         const notifications = await Notification.find({}).sort({ _id: -1 });
//         res.json({ success: true, message: "Notifications retrieved successfully.", data: notifications });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));


// router.delete('/delete-notification/:id', asyncHandler(async (req, res) => {
//     const notificationID = req.params.id;
//     try {
//         const notification = await Notification.findByIdAndDelete(notificationID);
//         if (!notification) {
//             return res.status(404).json({ success: false, message: "Notification not found." });
//         }
//         res.json({ success: true, message: "Notification deleted successfully.",data:null });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));


// module.exports = router;


// // const express = require('express');
// // const router = express.Router();
// // const asyncHandler = require('express-async-handler');
// // const Notification = require('../model/notification');
// // const OneSignal = require('onesignal-node');
// // const dotenv = require('dotenv');
// // dotenv.config();


// // const client = new OneSignal.Client(process.env.ONE_SIGNAL_APP_ID, process.env.ONE_SIGNAL_REST_API_KEY);

// // router.post('/send-notification', asyncHandler(async (req, res) => {
// //     const { title, description, imageUrl } = req.body;

// //     const notificationBody = {
// //         contents: {
// //             'en': description
// //         },
// //         headings: {
// //             'en': title
// //         },
// //         included_segments: ['All'],
// //         ...(imageUrl && { big_picture: imageUrl })
// //     };

// //     const response = await client.createNotification(notificationBody);
// //     const notificationId = response.body.id;
// //     console.log('Notification sent to all users:', notificationId);
// //     const notification = new Notification({ notificationId, title,description,imageUrl });
// //     const newNotification = await notification.save();
// //     res.json({ success: true, message: 'Notification sent successfully', data: null });
// // }));

// // router.get('/track-notification/:id', asyncHandler(async (req, res) => {
// //     const  notificationId  =req.params.id;

// //     const response = await client.viewNotification(notificationId);
// //     const androidStats = response.body.platform_delivery_stats;

// //     const result = {
// //         platform: 'Android',
// //         success_delivery: androidStats.android.successful,
// //         failed_delivery: androidStats.android.failed,
// //         errored_delivery: androidStats.android.errored,
// //         opened_notification: androidStats.android.converted
// //     };
// //     console.log('Notification details:', androidStats);
// //     res.json({ success: true, message: 'success', data: result });
// // }));


// // router.get('/all-notification', asyncHandler(async (req, res) => {
// //     try {
// //         const notifications = await Notification.find({}).sort({ _id: -1 });
// //         res.json({ success: true, message: "Notifications retrieved successfully.", data: notifications });
// //     } catch (error) {
// //         res.status(500).json({ success: false, message: error.message });
// //     }
// // }));


// // router.delete('/delete-notification/:id', asyncHandler(async (req, res) => {
// //     const notificationID = req.params.id;
// //     try {
// //         const notification = await Notification.findByIdAndDelete(notificationID);
// //         if (!notification) {
// //             return res.status(404).json({ success: false, message: "Notification not found." });
// //         }
// //         res.json({ success: true, message: "Notification deleted successfully.",data:null });
// //     } catch (error) {
// //         res.status(500).json({ success: false, message: error.message });
// //     }
// // }));


// // module.exports = router;


const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Notification = require('../model/notification');
const dotenv = require('dotenv');
dotenv.config();

// Helper to call OneSignal API directly
const oneSignalRequest = async (method, path, body = null) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${process.env.ONE_SIGNAL_REST_API_KEY}` // v2 format
        }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`https://api.onesignal.com${path}`, options);
    const data = await response.json();
    if (!response.ok) throw { status: response.status, data };
    return data;
};

router.post('/send-notification', asyncHandler(async (req, res) => {
    const { title, description, imageUrl } = req.body;
    try {
        const payload = {
            app_id: process.env.ONE_SIGNAL_APP_ID,
            contents: { en: description },
            headings: { en: title },
            included_segments: ['All'],
            ...(imageUrl && { big_picture: imageUrl })
        };

        const response = await oneSignalRequest('POST', '/notifications', payload);
        const notificationId = response.id;

        const notification = new Notification({ notificationId, title, description, imageUrl });
        await notification.save();

        res.json({ success: true, message: 'Notification sent successfully', data: null });
    } catch (error) {
        console.error('OneSignal send error:', error);
        res.status(500).json({ success: false, message: JSON.stringify(error.data) });
    }
}));

router.get('/track-notification/:id', asyncHandler(async (req, res) => {
    const notificationId = req.params.id;
    try {
        const response = await oneSignalRequest(
            'GET',
            `/notifications/${notificationId}?app_id=${process.env.ONE_SIGNAL_APP_ID}`
        );
        const androidStats = response.platform_delivery_stats;

        const result = {
            platform: 'Android',
            success_delivery: androidStats?.android?.successful || 0,
            failed_delivery: androidStats?.android?.failed || 0,
            errored_delivery: androidStats?.android?.errored || 0,
            opened_notification: androidStats?.android?.converted || 0
        };

        res.json({ success: true, message: 'success', data: result });
    } catch (error) {
        console.error('OneSignal track error:', error);
        res.status(500).json({ success: false, message: JSON.stringify(error.data) });
    }
}));



router.get('/all-notification', asyncHandler(async (req, res) => {
    try {
        console.log("App ID:", process.env.ONE_SIGNAL_APP_ID)
        const notifications = await Notification.find({}).sort({ _id: -1 });
        res.json({ success: true, message: "Notifications retrieved successfully.", data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


router.delete('/delete-notification/:id', asyncHandler(async (req, res) => {
    const notificationID = req.params.id;
    try {
        const notification = await Notification.findByIdAndDelete(notificationID);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found." });
        }
        res.json({ success: true, message: "Notification deleted successfully.",data:null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


module.exports = router;