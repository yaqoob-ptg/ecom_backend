const mongoose = require("mongoose");

const posterSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // This should match the model name you use when you create the User model
      required: [true, "Admin ID is required"],
    },
    posterName: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    publicId: {
      // ← added for Cloudinary deletion
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Poster = mongoose.model("Poster", posterSchema);

module.exports = Poster;
