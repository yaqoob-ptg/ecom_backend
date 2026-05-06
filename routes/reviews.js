const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const Order = require("../model/order");
const Product = require("../model/product");
const User = require("../model/user");
const auth = require("../middleware/auth");

router.use(auth);

// POST /reviews — submit a review for a product
router.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const { productId, rating, comment } = req.body;
      const userId = req.user._id;

      if (!productId || !rating) {
        return res.status(400).json({
          success: false,
          message: "productId and rating are required.",
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5.",
        });
      }

      // 1. Check the user has a DELIVERED order containing this product
      const deliveredOrder = await Order.findOne({
        userID: userId,
        orderStatus: "delivered",
        "items.productID": productId,
      });

      if (!deliveredOrder) {
        return res.status(403).json({
          success: false,
          message: "You can only review products from delivered orders.",
        });
      }

      // 2. Check user hasn't already reviewed this product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      const alreadyReviewed = product.reviews.some(
        (r) => r.userId.toString() === userId.toString()
      );

      if (alreadyReviewed) {
        return res.status(409).json({
          success: false,
          message: "You have already reviewed this product.",
        });
      }

      // 3. Get user name
      const user = await User.findById(userId).select("name");

      // 4. Push review to product
      product.reviews.push({
        userId,
        userName: user?.name ?? "Anonymous",
        rating: Number(rating),
        comment: comment ?? "",
      });

      await product.save();

      res.json({
        success: true,
        message: "Review submitted successfully.",
        data: product.reviews[product.reviews.length - 1],
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// GET /reviews/product/:productId — get all reviews for a product
router.get(
  "/product/:productId",
  asyncHandler(async (req, res) => {
    try {
      const product = await Product.findById(req.params.productId).select("reviews");
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      const sorted = [...product.reviews].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      res.json({
        success: true,
        message: "Reviews retrieved successfully.",
        data: sorted,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// GET /reviews/can-review/:productId — check if the current user can review
router.get(
  "/can-review/:productId",
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user._id;
      const { productId } = req.params;

      const deliveredOrder = await Order.findOne({
        userID: userId,
        orderStatus: "delivered",
        "items.productID": productId,
      });

      if (!deliveredOrder) {
        return res.json({ success: true, data: { canReview: false, reason: "no_delivered_order" } });
      }

      const product = await Product.findById(productId).select("reviews");
      const alreadyReviewed = product?.reviews.some(
        (r) => r.userId.toString() === userId.toString()
      );

      res.json({
        success: true,
        data: {
          canReview: !alreadyReviewed,
          reason: alreadyReviewed ? "already_reviewed" : null,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;