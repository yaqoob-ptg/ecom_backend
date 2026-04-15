// const express = require('express');
// const router = express.Router();
// const Category = require('../model/category');
// const SubCategory = require('../model/subCategory');
// const Product = require('../model/product');
// const { uploadCategory } = require('../uploadFile');
// const multer = require('multer');
// const asyncHandler = require('express-async-handler');

// // Get all categories
// router.get('/', asyncHandler(async (req, res) => {
//     try {
//         const categories = await Category.find();
//         res.json({ success: true, message: "Categories retrieved successfully.", data: categories });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Get a category by ID
// router.get('/:id', asyncHandler(async (req, res) => {
//     try {
//         const categoryID = req.params.id;
//         const category = await Category.findById(categoryID);
//         if (!category) {
//             return res.status(404).json({ success: false, message: "Category not found." });
//         }
//         res.json({ success: true, message: "Category retrieved successfully.", data: category });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Create a new category with image upload
// router.post('/', asyncHandler(async (req, res) => {
//     try {
//         uploadCategory.single('img')(req, res, async function (err) {
//             if (err instanceof multer.MulterError) {
//                 if (err.code === 'LIMIT_FILE_SIZE') {
//                     err.message = 'File size is too large. Maximum filesize is 5MB.';
//                 }
//                 console.log(`Add category: ${err}`);
//                 return res.json({ success: false, message: err });
//             } else if (err) {
//                 console.log(`Add category: ${err}`);
//                 return res.json({ success: false, message: err });
//             }
//             const { name } = req.body;
//             let imageUrl = 'no_url';
//             if (req.file) {
//                 imageUrl = `/image/category/${req.file.filename}`;
//             }
//             console.log('url ', req.file)

//             if (!name) {
//                 return res.status(400).json({ success: false, message: "Name is required." });
//             }

//             try {
//                 const newCategory = new Category({
//                     name: name,
//                     image: imageUrl
//                 });
//                 await newCategory.save();
//                 res.json({ success: true, message: "Category created successfully.", data: null });
//             } catch (error) {
//                 console.error("Error creating category:", error);
//                 res.status(500).json({ success: false, message: error.message });
//             }

//         });

//     } catch (err) {
//         console.log(`Error creating category: ${err.message}`);
//         return res.status(500).json({ success: false, message: err.message });
//     }
// }));

// // Update a category
// router.put('/:id', asyncHandler(async (req, res) => {
//     try {
//         const categoryID = req.params.id;
//         uploadCategory.single('img')(req, res, async function (err) {
//             if (err instanceof multer.MulterError) {
//                 if (err.code === 'LIMIT_FILE_SIZE') {
//                     err.message = 'File size is too large. Maximum filesize is 5MB.';
//                 }
//                 console.log(`Update category: ${err.message}`);
//                 return res.json({ success: false, message: err.message });
//             } else if (err) {
//                 console.log(`Update category: ${err.message}`);
//                 return res.json({ success: false, message: err.message });
//             }

//             const { name } = req.body;
//             let image = req.body.image;

//             if (req.file) {
//                 image = `/image/category/${req.file.filename}`;
//             }

//             if (!name || !image) {
//                 return res.status(400).json({ success: false, message: "Name and image are required." });
//             }

//             try {
//                 const updatedCategory = await Category.findByIdAndUpdate(categoryID, { name: name, image: image }, { new: true });
//                 if (!updatedCategory) {
//                     return res.status(404).json({ success: false, message: "Category not found." });
//                 }
//                 res.json({ success: true, message: "Category updated successfully.", data: null });
//             } catch (error) {
//                 res.status(500).json({ success: false, message: error.message });
//             }

//         });

//     } catch (err) {
//         console.log(`Error updating category: ${err.message}`);
//         return res.status(500).json({ success: false, message: err.message });
//     }
// }));

// // Delete a category
// router.delete('/:id', asyncHandler(async (req, res) => {
//     try {
//         const categoryID = req.params.id;

//         // Check if any subcategories reference this category
//         const subcategories = await SubCategory.find({ categoryId: categoryID });
//         if (subcategories.length > 0) {
//             return res.status(400).json({ success: false, message: "Cannot delete category. Subcategories are referencing it." });
//         }

//         // Check if any products reference this category
//         const products = await Product.find({ proCategoryId: categoryID });
//         if (products.length > 0) {
//             return res.status(400).json({ success: false, message: "Cannot delete category. Products are referencing it." });
//         }

//         // If no subcategories or products are referencing the category, proceed with deletion
//         const category = await Category.findByIdAndDelete(categoryID);
//         if (!category) {
//             return res.status(404).json({ success: false, message: "Category not found." });
//         }
//         res.json({ success: true, message: "Category deleted successfully." });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));


// module.exports = router;



//with cloudinary
const express      = require('express');
const router       = express.Router();
const multer       = require('multer');
const Category     = require('../model/category');
const SubCategory  = require('../model/subCategory');
const Product      = require('../model/product');
const cloudinary   = require('../config/cloudinary');
const { upload, uploadToCloudinary } = require('../middleware/uploadMiddleware');
const asyncHandler = require('express-async-handler');

// ─── GET ALL CATEGORIES ───────────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
    const categories = await Category.find();
    res.json({ success: true, message: "Categories retrieved successfully.", data: categories });
}));

// ─── GET CATEGORY BY ID ───────────────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return res.status(404).json({ success: false, message: "Category not found." });
    }
    res.json({ success: true, message: "Category retrieved successfully.", data: category });
}));

// ─── CREATE CATEGORY ──────────────────────────────────────────────────────────
router.post('/', asyncHandler(async (req, res) => {
    upload.single('img')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') err.message = 'File size is too large. Maximum filesize is 5MB.';
            return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required." });
        }

        // Upload image to Cloudinary
        let image    = 'no_url';
        let publicId = null;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'categories');
            image    = result.url;
            publicId = result.publicId;
        }

        const newCategory = new Category({ name, image, publicId });
        await newCategory.save();

        res.json({ success: true, message: "Category created successfully.", data: null });
    });
}));
// router.post(
//   '/',
//   upload.single('img'),
//   asyncHandler(async (req, res) => {

//     const { name } = req.body;

//     if (!name) {
//       return res.status(400).json({
//         success: false,
//         message: "Name is required."
//       });
//     }

//     let image = 'no_url';
//     let publicId = null;

//     if (req.file) {
//       const result = await uploadToCloudinary(
//         req.file.buffer,
//         'categories'
//       );

//       image = result.url;
//       publicId = result.publicId;
//     }

//     const newCategory = new Category({
//       name,
//       image,
//       publicId
//     });

//     await newCategory.save();

//     res.json({
//       success: true,
//       message: "Category created successfully."
//     });
//   })
// );

// ─── UPDATE CATEGORY ──────────────────────────────────────────────────────────
router.put('/:id', asyncHandler(async (req, res) => {
    upload.single('img')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') err.message = 'File size is too large. Maximum filesize is 5MB.';
            return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }

        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required." });
        }

        category.name = name;

        // If a new image was uploaded, delete old from Cloudinary and upload new
        if (req.file) {
            if (category.publicId) {
                await cloudinary.uploader.destroy(category.publicId).catch(e =>
                    console.error(`Cloudinary delete failed for ${category.publicId}:`, e.message)
                );
            }

            const result = await uploadToCloudinary(req.file.buffer, 'categories');
            category.image    = result.url;
            category.publicId = result.publicId;
        }

        await category.save();
        res.json({ success: true, message: "Category updated successfully.", data: null });
    });
}));
// router.put(
//   '/:id',
//   upload.single('img'),
//   asyncHandler(async (req, res) => {

//     const category = await Category.findById(req.params.id);

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found."
//       });
//     }

//     const { name } = req.body;

//     if (!name) {
//       return res.status(400).json({
//         success: false,
//         message: "Name is required."
//       });
//     }

//     category.name = name;

//     if (req.file) {
//       if (category.publicId) {
//         await cloudinary.uploader.destroy(category.publicId);
//       }

//       const result = await uploadToCloudinary(
//         req.file.buffer,
//         'categories'
//       );

//       category.image = result.url;
//       category.publicId = result.publicId;
//     }

//     await category.save();

//     res.json({
//       success: true,
//       message: "Category updated successfully."
//     });
//   })
// );

// ─── DELETE CATEGORY ──────────────────────────────────────────────────────────
router.delete('/:id', asyncHandler(async (req, res) => {
    const categoryID = req.params.id;

    // Block deletion if subcategories reference this category
    const subcategories = await SubCategory.find({ categoryId: categoryID });
    if (subcategories.length > 0) {
        return res.status(400).json({ success: false, message: "Cannot delete category. Subcategories are referencing it." });
    }

    // Block deletion if products reference this category
    const products = await Product.find({ proCategoryId: categoryID });
    if (products.length > 0) {
        return res.status(400).json({ success: false, message: "Cannot delete category. Products are referencing it." });
    }

    const category = await Category.findById(categoryID);
    if (!category) {
        return res.status(404).json({ success: false, message: "Category not found." });
    }

    // Delete image from Cloudinary
    if (category.publicId) {
        await cloudinary.uploader.destroy(category.publicId).catch(e =>
            console.error(`Cloudinary delete failed for ${category.publicId}:`, e.message)
        );
    }

    await category.deleteOne();
    res.json({ success: true, message: "Category deleted successfully.", data: null });
}));

module.exports = router;