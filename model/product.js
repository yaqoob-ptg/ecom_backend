const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // This should match the model name you use when you create the User model
      required: [true, "Admin ID is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    offerPrice: {
      type: Number,
    },
    proCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    proSubCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    proBrandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    proVariantTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VariantType",
    },

    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        userName: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    proVariantId: [String],
    images: [
      {
        image: {
          type: Number,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: false,
          default: null,
        },
      },
    ],
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
