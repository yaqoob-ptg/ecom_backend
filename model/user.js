// // const mongoose = require('mongoose');

// // const userSchema = new mongoose.Schema({
// //   name: {
// //     type: String,
// //     required: true
// //   },
// //   password: {
// //     type: String,
// //     required: true
// //   },
// //   createdAt: {
// //     type: Date,
// //     default: Date.now
// //   },
// //   updatedAt: {
// //     type: Date,
// //     default: Date.now
// //   }
// // });

// // const User = mongoose.model('User', userSchema);

// // module.exports = User;

// const mongoose = require("mongoose");
// const crypto = require("crypto");

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//   },
//   phone: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   location: {
//     type: String,
//     required: false,
//     trim: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   refreshToken: {
//     type: String,
//     default: null,
//   },
//   role: {
//     type: String,
//     enum: ["user", "admin", "superAdmin", "guest"],
//     default: "user",
//   },
//   isVerified: {
//     type: Boolean,
//     default: false,
//   },
//   // verificationToken: {
//   //   type: String,
//   //   default: () => crypto.randomBytes(32).toString("hex"),
//   // },
//   // verificationTokenExpires: {
//   //   type: Date,
//   //   default: () => Date.now() + 24 * 60 * 60 * 1000,
//   // },
//   verificationToken: {
//     type: String,
//     default: null,
//   },
//   verificationTokenExpires: {
//     type: Date,
//     default: null,
//   },
//   guestExpiresAt: {
//     type: Date,
//     default: null,
//   },

//   //for password reset
//   resetPasswordToken: {
//     type: String,
//     default: undefined,
//   },
//   resetPasswordExpires: {
//     type: Date,
//     default: undefined,
//   },
//   passwordResetRequests: {
//     count: { type: Number, default: 0 },
//     firstRequestDate: { type: Date, default: null },
//     lastResetDate: { type: Date, default: null }, // Track last successful reset
//   },

//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// });

// userSchema.index(
//   { guestExpiresAt: 1 },
//   { expireAfterSeconds: 0, partialFilterExpression: { role: "guest" } },
// );

// const User = mongoose.model("User", userSchema);
// module.exports = User;

const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: false,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["user", "admin", "superAdmin", "guest"],
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verificationTokenExpires: {
    type: Date,
    default: null,
  },
  guestExpiresAt: {
    type: Date,
    default: null,
  },

  //for password reset
  resetPasswordToken: {
    type: String,
    default: undefined,
  },
  resetPasswordExpires: {
    type: Date,
    default: undefined,
  },
  passwordResetRequests: {
    count: { type: Number, default: 0 },
    firstRequestDate: { type: Date, default: null },
    lastResetDate: { type: Date, default: null },
  },

  // NEW: Enhanced security fields for super admin
  securitySettings: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null },
    loginAlerts: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 15 }, // minutes
  },

  // Track failed login attempts (for all roles)
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },

  // Track login history (especially important for super admin)
  loginHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      ip: { type: String },
      userAgent: { type: String },
      success: { type: Boolean },
    },
  ],

  // Last login tracking
  lastLoginAt: { type: Date, default: null },
  lastLoginIp: { type: String, default: null },

  // Account status
  isActive: { type: Boolean, default: true },
  deactivatedAt: { type: Date, default: null },
  deactivationReason: { type: String, default: null },

  isApproved: {
    type: Boolean,
    default: false, // admins start as unapproved
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for faster queries
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ email: 1, role: 1 });

// TTL index for guest users
userSchema.index(
  { guestExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { role: "guest" } },
);

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Method to handle failed login
userSchema.methods.incrementFailedLogins = async function () {
  this.failedLoginAttempts += 1;

  // Lock account after 5 failed attempts for super admin, 10 for others
  const maxAttempts = this.role === "superAdmin" ? 5 : 10;

  if (this.failedLoginAttempts >= maxAttempts) {
    this.lockUntil =
      Date.now() +
      (this.role === "superAdmin" ? 30 * 60 * 1000 : 60 * 60 * 1000); // 30 min for super admin, 1 hour for others
  }

  await this.save();
};

// Method to reset failed logins
userSchema.methods.resetFailedLogins = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

// Method to add login history
userSchema.methods.addLoginHistory = async function (ip, userAgent, success) {
  this.loginHistory.push({ timestamp: new Date(), ip, userAgent, success });
  // Keep only last 50 entries
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }
  await this.save();
};

const User = mongoose.model("User", userSchema);
module.exports = User;
