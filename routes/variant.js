const express = require("express");
const router = express.Router();
const Variant = require("../model/variant");
const Product = require("../model/product");
const asyncHandler = require("express-async-handler");
const auth = require("../middleware/auth");

router.use(auth);

// Get all variants
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      let filter = {};

      if (req.user.role === "admin") {
        filter.adminId = req.user._id;
      }

      const variants = await Variant.find(filter)
        .populate("variantTypeId")
        .sort({ variantTypeId: 1 });
      res.json({
        success: true,
        message: "Variants retrieved successfully.",
        data: variants,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

// Get a variant by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const variantID = req.params.id;
      const variant =
        await Variant.findById(variantID).populate("variantTypeId");
      if (!variant) {
        return res
          .status(404)
          .json({ success: false, message: "Variant not found." });
      }
      res.json({
        success: true,
        message: "Variant retrieved successfully.",
        data: variant,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

// Create a new variant
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, variantTypeId } = req.body;
    if (!name || !variantTypeId) {
      return res.status(400).json({
        success: false,
        message: "Name and VariantType ID are required.",
      });
    }

    try {
      // const variant = new Variant({ name, variantTypeId });
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admin can create variants",
        });
      }

      const variant = new Variant({
        adminId: req.user._id,
        name,
        variantTypeId,
      });
      const newVariant = await variant.save();
      res.json({
        success: true,
        message: "Variant created successfully.",
        data: null,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

// Update a variant
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const variantID = req.params.id;
    const { name, variantTypeId } = req.body;
    if (!name || !variantTypeId) {
      return res.status(400).json({
        success: false,
        message: "Name and VariantType ID are required.",
      });
    }

    try {
      const updatedVariant = await Variant.findByIdAndUpdate(
        variantID,
        { adminId: req.user._id, name, variantTypeId },
        { new: true },
      );
      if (!updatedVariant) {
        return res
          .status(404)
          .json({ success: false, message: "Variant not found or not yours." });
      }
      res.json({
        success: true,
        message: "Variant updated successfully.",
        data: null,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

// Delete a variant
// router.delete(
//   "/:id",
//   asyncHandler(async (req, res) => {
//     const variantID = req.params.id;
//     try {
//       // Check if any products reference this variant
//       // const products = await Product.find({ proVariantId: variantID });
//       const products = await Product.find({
//         proVariantId: variantID,
//         adminId: req.user._id,
//       });
//       if (products.length > 0) {
//         return res
//           .status(400)
//           .json({
//             success: false,
//             message: "Cannot delete variant. Products are using it.",
//           });
//       }

//       // If no products are referencing the variant, proceed with deletion
//       const variant = await Variant.findOne({
//         _id: variantID,
//         adminId: req.user._id,
//       });
//       if (!variant) {
//         return res
//           .status(404)
//           .json({ success: false, message: "Variant not found or not yours." });
//       }
//       res.json({ success: true, message: "Variant deleted successfully." });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }),
// );

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const variantID = req.params.id;

    try {
      // 🔥 Check if admin's products are using this variant
      const products = await Product.find({
        proVariantId: variantID,
        adminId: req.user._id,
      });

      if (products.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete variant. Your products are using it.",
        });
      }

      // 🔥 Check ownership
      const variant = await Variant.findOne({
        _id: variantID,
        adminId: req.user._id,
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Variant not found or not yours.",
        });
      }

      // ✅ ACTUAL DELETE (you missed this)
      await variant.deleteOne();

      res.json({
        success: true,
        message: "Variant deleted successfully.",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

module.exports = router;
