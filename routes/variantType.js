const express = require("express");
const router = express.Router();
const VariantType = require("../model/variantType");
const Product = require("../model/product");
const Variant = require("../model/variant");
const asyncHandler = require("express-async-handler");
const auth = require("../middleware/auth");
router.use(auth);

// Get all variant types
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      let filter = {};

      if (req.user.role === "admin") {
        filter.adminId = req.user._id;
      }

      const variantTypes = await VariantType.find(filter);
      res.json({
        success: true,
        message: "VariantTypes retrieved successfully.",
        data: variantTypes,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

// Get a variant type by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const variantTypeID = req.params.id;
      const variantType = await VariantType.findById(variantTypeID);
      if (!variantType) {
        return res
          .status(404)
          .json({ success: false, message: "VariantType not found." });
      }
      res.json({
        success: true,
        message: "VariantType retrieved successfully.",
        data: variantType,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

// Create a new variant type
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, type } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required." });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can create variant types",
      });
    }

    try {
      const variantType = new VariantType({
        adminId: req.user._id,
        name,
        type,
      });
      const newVariantType = await variantType.save();
      res.json({
        success: true,
        message: "VariantType created successfully.",
        data: null,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

// Update a variant type
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const variantTypeID = req.params.id;
    const { name, type } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required." });
    }

    try {
      const updatedVariantType = await VariantType.findByIdAndUpdate(
        variantTypeID,
        { adminId: req.user._id, name, type },
        { new: true },
      );
      if (!updatedVariantType) {
        return res
          .status(404)
          .json({ success: false, message: "VariantType not found." });
      }
      res.json({
        success: true,
        message: "VariantType updated successfully.",
        data: null,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

// Delete a variant type
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const variantTypeID = req.params.id;

    try {
      // 1. Check if any variants are using it
      const variantCount = await Variant.countDocuments({
        adminId: req.user._id,
        variantTypeId: variantTypeID,
      });

      if (variantCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete variant type. It is associated with one or more variants.",
        });
      }

      // 2. Check if any products are using it
      const products = await Product.find({
        adminId: req.user._id,
        proVariantTypeId: variantTypeID,
      });

      if (products.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete variant type. Products are referencing it.",
        });
      }

      // 3. Delete WITH ownership check (correct way)
      const deleted = await VariantType.findOneAndDelete({
        _id: variantTypeID,
        adminId: req.user._id,
      });

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Variant type not found or not yours.",
        });
      }

      return res.json({
        success: true,
        message: "Variant type deleted successfully.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }),
);

module.exports = router;
