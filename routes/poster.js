// const express = require('express');
// const router = express.Router();
// const Poster = require('../model/poster');
// const { uploadPosters } = require('../uploadFile');
// const multer = require('multer');
// const asyncHandler = require('express-async-handler');

// // Get all posters
// router.get('/', asyncHandler(async (req, res) => {
//     try {
//         const posters = await Poster.find({});
//         res.json({ success: true, message: "Posters retrieved successfully.", data: posters });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Get a poster by ID
// router.get('/:id', asyncHandler(async (req, res) => {
//     try {
//         const posterID = req.params.id;
//         const poster = await Poster.findById(posterID);
//         if (!poster) {
//             return res.status(404).json({ success: false, message: "Poster not found." });
//         }
//         res.json({ success: true, message: "Poster retrieved successfully.", data: poster });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Create a new poster
// router.post('/', asyncHandler(async (req, res) => {
//     try {
//         uploadPosters.single('img')(req, res, async function (err) {
//             if (err instanceof multer.MulterError) {
//                 if (err.code === 'LIMIT_FILE_SIZE') {
//                     err.message = 'File size is too large. Maximum filesize is 5MB.';
//                 }
//                 console.log(`Add poster: ${err}`);
//                 return res.json({ success: false, message: err });
//             } else if (err) {
//                 console.log(`Add poster: ${err}`);
//                 return res.json({ success: false, message: err });
//             }
//             const { posterName } = req.body;
//             let imageUrl = 'no_url';
//             if (req.file) {
//                 imageUrl = `/image/poster/${req.file.filename}`;
//             }

//             if (!posterName) {
//                 return res.status(400).json({ success: false, message: "Name is required." });
//             }

//             try {
//                 const newPoster = new Poster({
//                     posterName: posterName,
//                     imageUrl: imageUrl
//                 });
//                 await newPoster.save();
//                 res.json({ success: true, message: "Poster created successfully.", data: null });
//             } catch (error) {
//                 console.error("Error creating Poster:", error);
//                 res.status(500).json({ success: false, message: error.message });
//             }

//         });

//     } catch (err) {
//         console.log(`Error creating Poster: ${err.message}`);
//         return res.status(500).json({ success: false, message: err.message });
//     }
// }));

// // Update a poster
// router.put('/:id', asyncHandler(async (req, res) => {
//     try {
//         const categoryID = req.params.id;
//         uploadPosters.single('img')(req, res, async function (err) {
//             if (err instanceof multer.MulterError) {
//                 if (err.code === 'LIMIT_FILE_SIZE') {
//                     err.message = 'File size is too large. Maximum filesize is 5MB.';
//                 }
//                 console.log(`Update poster: ${err.message}`);
//                 return res.json({ success: false, message: err.message });
//             } else if (err) {
//                 console.log(`Update poster: ${err.message}`);
//                 return res.json({ success: false, message: err.message });
//             }

//             const { posterName } = req.body;
//             let image = req.body.image;

//             if (req.file) {
//                 image = `/image/poster/${req.file.filename}`;
//             }

//             if (!posterName || !image) {
//                 return res.status(400).json({ success: false, message: "Name and image are required." });
//             }

//             try {
//                 const updatedPoster = await Poster.findByIdAndUpdate(categoryID, { posterName: posterName, imageUrl: image }, { new: true });
//                 if (!updatedPoster) {
//                     return res.status(404).json({ success: false, message: "Poster not found." });
//                 }
//                 res.json({ success: true, message: "Poster updated successfully.", data: null });
//             } catch (error) {
//                 res.status(500).json({ success: false, message: error.message });
//             }

//         });

//     } catch (err) {
//         console.log(`Error updating poster: ${err.message}`);
//         return res.status(500).json({ success: false, message: err.message });
//     }
// }));

// // Delete a poster
// router.delete('/:id', asyncHandler(async (req, res) => {
//     const posterID = req.params.id;
//     try {
//         const deletedPoster = await Poster.findByIdAndDelete(posterID);
//         if (!deletedPoster) {
//             return res.status(404).json({ success: false, message: "Poster not found." });
//         }
//         res.json({ success: true, message: "Poster deleted successfully." });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// module.exports = router;

//? Refactored poster routes to use Cloudinary for image storage instead of local disk storage
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Poster = require("../model/poster");
const cloudinary = require("../config/cloudinary");
const {
  upload,
  uploadToCloudinary,
} = require("../middleware/uploadMiddleware");
const asyncHandler = require("express-async-handler");
const auth = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// ─── GET ALL POSTERS ──────────────────────────────────────────────────────────
router.get(
  "/",
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.user.role === "admin") {
      filter.adminId = req.user._id; // Regular users see only their posters
    }
    const posters = await Poster.find(filter);
    res.json({
      success: true,
      message: "Posters retrieved successfully.",
      data: posters,
    });
  }),
);

// ─── GET POSTER BY ID ─────────────────────────────────────────────────────────
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    // const poster = await Poster.findById(req.params.id);
    const poster = await Poster.findOne({
      _id: req.params.id,
      adminId: req.user._id,
    });
    if (!poster) {
      return res
        .status(404)
        .json({ success: false, message: "Poster not found." });
    }
    res.json({
      success: true,
      message: "Poster retrieved successfully.",
      data: poster,
    });
  }),
);

// ─── CREATE POSTER ────────────────────────────────────────────────────────────
router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
    return res.status(403).json({
        success: false,
        message: "Only admin can create posters"
    });
}
    upload.single("img")(req, res, async (err) => {
    
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE")
          err.message = "File size is too large. Maximum filesize is 5MB.";
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const { posterName } = req.body;

      if (!posterName) {
        return res
          .status(400)
          .json({ success: false, message: "Name is required." });
      }

      // Upload image to Cloudinary
      let imageUrl = "no_url";
      let publicId = null;

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "posters");
        imageUrl = result.url;
        publicId = result.publicId;
      }

      const newPoster = new Poster({
        adminId: req.user._id,
        posterName,
        imageUrl,
        publicId,
      });
      await newPoster.save();

      res.json({
        success: true,
        message: "Poster created successfully.",
        data: null,
      });
    });
  }),
);
// router.post(
//   '/',
//   upload.single('img'),
//   asyncHandler(async (req, res) => {

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Image is required."
//       });
//     }

//     const { posterName } = req.body;

//     if (!posterName) {
//       return res.status(400).json({
//         success: false,
//         message: "Name is required."
//       });
//     }

//     let imageUrl = 'no_url';
//     let publicId = null;

//     const result = await uploadToCloudinary(
//       req.file.buffer,
//       'posters'
//     );

//     imageUrl = result.url;
//     publicId = result.publicId;

//     const newPoster = new Poster({
//       posterName,
//       imageUrl,
//       publicId
//     });

//     await newPoster.save();

//     return res.json({
//       success: true,
//       message: "Poster created successfully.",
//       data: newPoster
//     });
//   })
// );

// ─── UPDATE POSTER ────────────────────────────────────────────────────────────
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    upload.single("img")(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE")
          err.message = "File size is too large. Maximum filesize is 5MB.";
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

    //   const poster = await Poster.findById(req.params.id);
    const poster = await Poster.findOne({
    _id: req.params.id,
    adminId: req.user._id
});
      if (!poster) {
        return res
          .status(404)
          .json({ success: false, message: "Poster not found." });
      }

      const { posterName } = req.body;

      if (!posterName) {
        return res
          .status(400)
          .json({ success: false, message: "Name is required." });
      }

      poster.posterName = posterName;

      // If a new image was uploaded, delete old from Cloudinary and upload new
      if (req.file) {
        if (poster.publicId) {
          await cloudinary.uploader
            .destroy(poster.publicId)
            .catch((e) =>
              console.error(
                `Cloudinary delete failed for ${poster.publicId}:`,
                e.message,
              ),
            );
        }

        const result = await uploadToCloudinary(req.file.buffer, "posters");
        poster.imageUrl = result.url;
        poster.publicId = result.publicId;
      }

      await poster.save();
      res.json({
        success: true,
        message: "Poster updated successfully.",
        data: null,
      });
    });
  }),
);

// router.put(
//   '/:id',
//   upload.single('img'),
//   asyncHandler(async (req, res) => {

//     const poster = await Poster.findById(req.params.id);

//     if (!poster) {
//       return res.status(404).json({
//         success: false,
//         message: "Poster not found."
//       });
//     }

//     const { posterName } = req.body;

//     if (!posterName) {
//       return res.status(400).json({
//         success: false,
//         message: "Name is required."
//       });
//     }

//     poster.posterName = posterName;

//     if (req.file) {

//       // delete old image
//       if (poster.publicId) {
//         await cloudinary.uploader.destroy(poster.publicId).catch(err => {
//           console.error("Cloudinary delete error:", err.message);
//         });
//       }

//       // upload new image
//       const result = await uploadToCloudinary(
//         req.file.buffer,
//         'posters'
//       );

//       poster.imageUrl = result.url;
//       poster.publicId = result.publicId;
//     }

//     await poster.save();

//     return res.json({
//       success: true,
//       message: "Poster updated successfully.",
//       data: poster
//     });
//   })
// );

// ─── DELETE POSTER ────────────────────────────────────────────────────────────
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    // const poster = await Poster.findById(req.params.id);
    const poster = await Poster.findOne({
    _id: req.params.id,
    adminId: req.user._id
});
    if (!poster) {
      return res
        .status(404)
        .json({ success: false, message: "Poster not found." });
    }

    // Delete image from Cloudinary
    if (poster.publicId) {
      await cloudinary.uploader
        .destroy(poster.publicId)
        .catch((e) =>
          console.error(
            `Cloudinary delete failed for ${poster.publicId}:`,
            e.message,
          ),
        );
    }

    await poster.deleteOne();
    res.json({
      success: true,
      message: "Poster deleted successfully.",
      data: null,
    });
  }),
);

module.exports = router;
