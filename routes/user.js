// const express = require('express');
// const asyncHandler = require('express-async-handler');
// const router = express.Router();
// const User = require('../model/user');

// // Get all users
// router.get('/', asyncHandler(async (req, res) => {
//     try {
//         const users = await User.find();
//         res.json({ success: true, message: "Users retrieved successfully.", data: users });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // login
// router.post('/login', async (req, res) => {
//     const { name, password } = req.body;

//     try {
//         // Check if the user exists
//         const user = await User.findOne({ name });

//         if (!user) {
//             return res.status(401).json({ success: false, message: "Invalid name or password." });
//         }
//         // Check if the password is correct
//         if (user.password !== password) {
//             return res.status(401).json({ success: false, message: "Invalid name or password." });
//         }

//         // Authentication successful
//         res.status(200).json({ success: true, message: "Login successful.",data: user });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// });

// // Get a user by ID
// router.get('/:id', asyncHandler(async (req, res) => {
//     try {
//         const userID = req.params.id;
//         const user = await User.findById(userID);
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }
//         res.json({ success: true, message: "User retrieved successfully.", data: user });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Create a new user
// router.post('/register', asyncHandler(async (req, res) => {
//     const { name, password } = req.body;
//     if (!name || !password) {
//         return res.status(400).json({ success: false, message: "Name, and password are required." });
//     }

//     try {
//         const user = new User({ name, password });
//         const newUser = await user.save();
//         res.json({ success: true, message: "User created successfully.", data: null });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Update a user
// router.put('/:id', asyncHandler(async (req, res) => {
//     try {
//         const userID = req.params.id;
//         const { name, password } = req.body;
//         if (!name || !password) {
//             return res.status(400).json({ success: false, message: "Name,  and password are required." });
//         }

//         const updatedUser = await User.findByIdAndUpdate(
//             userID,
//             { name, password },
//             { new: true }
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         res.json({ success: true, message: "User updated successfully.", data: updatedUser });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Delete a user
// router.delete('/:id', asyncHandler(async (req, res) => {
//     try {
//         const userID = req.params.id;
//         const deletedUser = await User.findByIdAndDelete(userID);
//         if (!deletedUser) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }
//         res.json({ success: true, message: "User deleted successfully." });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// module.exports = router;
const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../model/user");
const jwt = require("jsonwebtoken");

// ─── Email Transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.BASE_URL}/users/verify-email/${token}`;
  await transporter.sendMail({
    from: `"E-commerce" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email Address",
    html: `
      <h2>Email Verification</h2>
      <p>Thanks for registering! Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}" style="padding:10px 20px;background:#4CAF50;color:white;text-decoration:none;border-radius:5px;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't register, you can safely ignore this email.</p>
    `,
  });
};

// ─── Register ──────────────────────────────────────────────────────────────────
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and password are required.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || "user",
    });

    await user.save();

    try {
      await sendVerificationEmail(user.email, user.verificationToken);
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.status(201).json({
      success: true,
      message:
        "Registration successful! A verification email has been sent. Please verify your email to access your account.",
      data: null,
    });
  }),
);

// ─── Login ─────────────────────────────────────────────────────────────────────
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password, requiredRole } = req.body;

    if (!email || !password || !requiredRole) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }
    if (requiredRole == "admin" && user.role !== "admin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Access Denied: You do not have administrative privileges.",
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Your email is not verified. Please check your inbox and verify your email before logging in.",
      });
    }

    const accessToken = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // ─── SAVE REFRESH TOKEN IN DB ───────────────────
    user.refreshToken = refreshToken;
    await user.save();
    const {
      password: _,
      verificationToken: __,
      verificationTokenExpires: ___,
      ...userData
    } = user.toObject();

    res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      refreshToken,
      data: userData,
    });
  }),
);
router.post('/refresh-token', asyncHandler(async (req, res) => {

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded._id);

  if (!user || user.refreshToken !== refreshToken) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  const newAccessToken = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({
    accessToken: newAccessToken
  });

}));

// ─── Guest Login ───────────────────────────────────────────────────────────────
router.post(
  "/guest",
  asyncHandler(async (req, res) => {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const guestUser = new User({
      name: "Guest User",
      email: `${guestId}@guest.local`,
      phone: "0000000000",
      password: await bcrypt.hash(Math.random().toString(36), 12),
      role: "guest",
      isVerified: true,
      guestExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await guestUser.save();

    const {
      password: _,
      verificationToken: __,
      verificationTokenExpires: ___,
      ...userData
    } = guestUser.toObject();

    res.status(201).json({
      success: true,
      message: "Logged in as guest. Your session will expire in 24 hours.",
      data: userData,
    });
  }),
);

// ─── Verify Email ──────────────────────────────────────────────────────────────
// router.get('/verify-email/:token', asyncHandler(async (req, res) => {
//   const { token } = req.params;

//   const user = await User.findOne({
//     verificationToken: token,
//     verificationTokenExpires: { $gt: Date.now() }
//   });

//   if (!user) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid or expired verification link. Please register again."
//     });
//   }

//   user.isVerified = true;
//   user.verificationToken = undefined;
//   user.verificationTokenExpires = undefined;
//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Email verified successfully! You can now log in."
//   });
// }));

// ─── Verify Email (With HTML Page) ──────────────────────────────────────────────
router.get(
  "/verify-email/:token",
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    // HTML Template Function
    const getHtmlPage = (title, message, isSuccess) => `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f4f4f9; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          h1 { color: ${isSuccess ? "#4CAF50" : "#f44336"}; }
          .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${isSuccess ? "Verified!" : "Oops!"}</h1>
          <p>${message}</p>
          <!-- ${isSuccess ? '<a href="http://yourfrontend.com/login" class="btn">Go to Login</a>' : '<a href="http://yourfrontend.com/register" class="btn">Try Registering Again</a>'} -->
        </div>
      </body>
    </html>
  `;

    if (!user) {
      return res
        .status(400)
        .send(
          getHtmlPage(
            "Verification Failed",
            "The link is invalid or has expired.",
            false,
          ),
        );
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res
      .status(200)
      .send(
        getHtmlPage(
          "Email Verified",
          "Your email has been successfully verified. You can now log in to your account.",
          true,
        ),
      );
  }),
);

// ─── Get All Users ─────────────────────────────────────────────────────────────
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await User.find().select(
      "-password -verificationToken -verificationTokenExpires",
    );
    res.json({
      success: true,
      message: "Users retrieved successfully.",
      data: users,
    });
  }),
);

// ─── Get User by ID ────────────────────────────────────────────────────────────
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select(
      "-password -verificationToken -verificationTokenExpires",
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.json({
      success: true,
      message: "User retrieved successfully.",
      data: user,
    });
  }),
);

router.post('/logout', asyncHandler(async (req, res) => {

  const { userId } = req.body;

  await User.findByIdAndUpdate(userId, {
    refreshToken: null
  });

  res.json({ message: "Logged out successfully" });

}));

// ─── Update User ───────────────────────────────────────────────────────────────
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { name, phone, password, role } = req.body;

    const updateFields = { updatedAt: Date.now() };
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (role) updateFields.role = role;
    if (password) updateFields.password = await bcrypt.hash(password, 12);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true },
    ).select("-password -verificationToken -verificationTokenExpires");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({
      success: true,
      message: "User updated successfully.",
      data: updatedUser,
    });
  }),
);

// ─── Delete User ───────────────────────────────────────────────────────────────
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.json({ success: true, message: "User deleted successfully." });
  }),
);

module.exports = router;
