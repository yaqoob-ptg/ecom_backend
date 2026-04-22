// const express = require('express');
// const ngrok = require('ngrok');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const asyncHandler = require('express-async-handler');
// const dotenv = require('dotenv');
// dotenv.config();

// const app = express();
// //?Middle wair
// app.use(cors({ origin: '*' }))
// app.use(bodyParser.json());
// //? setting static folder path
// app.use('/image/products', express.static('public/products'));
// app.use('/image/category', express.static('public/category'));
// app.use('/image/poster', express.static('public/posters'));

// const URL = process.env.MONGO_URL;
// mongoose.connect(URL);
// const db = mongoose.connection;
// db.on('error', (error) => console.error(error));
// db.once('open', () => console.log('Connected to Database'));

// // Routes
// app.use('/categories', require('./routes/category'));
// app.use('/subCategories', require('./routes/subCategory'));
// app.use('/brands', require('./routes/brand'));
// app.use('/variantTypes', require('./routes/variantType'));
// app.use('/variants', require('./routes/variant'));
// app.use('/products', require('./routes/product'));
// app.use('/couponCodes', require('./routes/couponCode'));
// app.use('/posters', require('./routes/poster'));
// app.use('/users', require('./routes/user'));
// app.use('/orders', require('./routes/order'));
// app.use('/payment', require('./routes/payment'));
// app.use('/notification', require('./routes/notification'));


// // Example route using asyncHandler directly in app.js
// app.get('/', asyncHandler(async (req, res) => {
//     res.json({ success: true, message: 'API working successfully', data: null });
// }));

// // Global error handler
// app.use((error, req, res, next) => {
//     res.status(500).json({ success: false, message: error.message, data: null });
// });

// const PORT = process.env.PORT || 3000; 

// app.listen(PORT, () => {
//     console.log(`Local host running on http://localhost:${process.env.PORT}`);
//     // ngrok.connect(PORT).then(ngrokUrl=>{
//     //     console.log(`Ngrok URL: ${ngrokUrl}`);
//     // }).catch(error=>{
//     //     console.error('Error connecting to ngrok:', error);
//     // })
// });


// // for vercel
const express = require('express');
const ngrok = require('ngrok');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
// const path = require('path');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
//?Middle wair
app.use(cors({ origin: '*' }))
app.use(bodyParser.json());
//? setting static folder path
// app.use('/image/products', express.static(path.join(__dirname, 'public/products')));
// app.use('/image/category', express.static(path.join(__dirname, 'public/category')));
// app.use('/image/poster', express.static(path.join(__dirname, 'public/posters')));

const URL = process.env.MONGO_URL;

// mongoose.connect(URL);
// const db = mongoose.connection;
// db.on('error', (error) => console.error(error));
// db.once('open', () => console.log('Connected to Database'));
// let isConnected = false;
// async function connectToMongoDB() {
//   try {
//     await mongoose.connect(process.env.MONGO_URL);
//     isConnected = true;
//     console.log('Connected to MongoDB');
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error);
//   }
// }
// app.use(async (req, res, next) => {
//   if (!isConnected) {
//   await  connectToMongoDB();
//   }
//   next();
// });
let cachedDb = null;

async function connectToMongoDB() {
  // If we already have a connection (or one is in progress), return it
  if (cachedDb) {
    return cachedDb;
  }

  // Otherwise, create a new connection
  // Note: We removed the deprecated options here to stop the warnings
  const opts = {
    bufferCommands: false, // Recommended for serverless
  };

  cachedDb = mongoose.connect(URL, opts).then((mongoose) => {
    console.log('New MongoDB connection established');
    return mongoose;
  });

  return cachedDb;
}

// Updated Middleware
app.use(async (req, res, next) => {
  try {
    await connectToMongoDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).send('Database connection failed');
  }
});
// Routes
app.use('/categories', require('./routes/category'));
app.use('/subCategories', require('./routes/subCategory'));
app.use('/brands', require('./routes/brand'));
app.use('/variantTypes', require('./routes/variantType'));
app.use('/variants', require('./routes/variant'));
app.use('/products', require('./routes/product'));
app.use('/couponCodes', require('./routes/couponCode'));
app.use('/posters', require('./routes/poster'));
app.use('/users', require('./routes/user'));
app.use('/super-admin',require('./routes/superAdmin'));
app.use('/orders', require('./routes/order'));
app.use('/payment', require('./routes/payment'));
app.use('/notification', require('./routes/notification'));


// Example route using asyncHandler directly in app.js
app.get('/', asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'API working successfully', data: null });
}));

// Global error handler
app.use((error, req, res, next) => {
    res.status(500).json({ success: false, message: error.message, data: null });
});


// //for running localhost
// const PORT = process.env.PORT || 3000; 

// app.listen(PORT, () => {
//     console.log(`Local host running on http://localhost:${process.env.PORT}`);
//     // ngrok.connect(PORT).then(ngrokUrl=>{
//     //     console.log(`Ngrok URL: ${ngrokUrl}`);
//     // }).catch(error=>{
//     //     console.error('Error connecting to ngrok:', error);
//     // })
// });

//do not use app.listen when deploying to vercel, vercel will handle the server for you
module.exports = app;
