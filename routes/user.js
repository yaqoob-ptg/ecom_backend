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
const crypto = require("crypto");

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
const sendPasswordResetEmail = async (email, resetToken) => {
  const BACKEND_URL = process.env.BASE_URL ;
  const ADMIN_URL = process.env.ADMIN_BASE_URL ; // Update with your admin URL
  
  // The reset link should point to the BACKEND URL (which serves the HTML page)
  const resetUrl = `${BACKEND_URL}/users/reset-password/${resetToken}`;
  
  console.log('Sending reset email to:', email);
  console.log('Reset URL:', resetUrl);
  console.log('Admin URL:', ADMIN_URL);
  
  await transporter.sendMail({
    from: `"E-Com Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request - E-Com Admin",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 0;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
          }
          .info {
            background-color: #d1ecf1;
            border-left: 4px solid #17a2b8;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset the password for your E-Com Admin account.</p>
            <p>Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="background-color: #f4f4f7; padding: 10px; border-radius: 4px; word-break: break-all;">
              ${resetUrl}
            </p>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 8px 0 0 20px;">
                <li>This link expires in <strong>1 hour</strong></li>
                <li>You can only use this link once</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            <div class="info">
              <strong>ℹ️ Note:</strong> After resetting your password, you will be redirected to the admin login page.
            </div>
            <p>Best regards,<br/>E-Com Admin Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} E-Com Admin. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};
// ─── Reset Password Page (HTML) ───────────────────────────────────────────────

router.get(
  "/reset-password/:token",
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    // Use different URLs for backend API and frontend redirects
    const BACKEND_URL = process.env.BASE_URL;  const ADMIN_URL = process.env.ADMIN_BASE_URL ; // Update with your admin URL

    const getResetPasswordPage = (token, isValid) => `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reset Password - E-Com Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            background: #212332;
            margin: 0; 
            padding: 20px; 
          }
          
          .card { 
            background: #2A2D3E;
            padding: 40px; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.3); 
            text-align: center; 
            max-width: 450px; 
            width: 100%; 
            border: 1px solid rgba(255,255,255,0.1);
          }
          
          h1 { 
            color: #ffffff; 
            margin-bottom: 20px;
            font-size: 28px;
            font-weight: 600;
          }
          
          .error { 
            color: #ff6b6b; 
          }
          
          .success { 
            color: #51cf66; 
          }
          
          .input-group {
            margin-bottom: 20px;
            text-align: left;
          }
          
          label {
            display: block;
            color: #a0a0b0;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 500;
          }
          
          input { 
            width: 100%; 
            padding: 14px 16px; 
            background: #212332;
            border: 1px solid #3a3d4e; 
            border-radius: 12px; 
            box-sizing: border-box;
            font-size: 16px;
            color: #ffffff;
            transition: all 0.3s ease;
          }
          
          input:focus {
            outline: none;
            border-color: #4CAF50;
            box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
          }
          
          input::placeholder {
            color: #6a6d7e;
          }
          
          button { 
            width: 100%; 
            padding: 14px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            border: none; 
            border-radius: 12px; 
            cursor: pointer; 
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            margin-top: 10px;
          }
          
          button:hover { 
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
          }
          
          button:disabled { 
            background: #3a3d4e;
            transform: none;
            cursor: not-allowed;
          }
          
          .message { 
            margin-top: 15px; 
            font-size: 14px;
            padding: 10px;
            border-radius: 8px;
          }
          
          .back-link {
            display: inline-block;
            margin-top: 20px;
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
            transition: color 0.3s;
          }
          
          .back-link:hover {
            color: #764ba2;
            text-decoration: underline;
          }
          
          .requirements {
            text-align: left;
            margin-top: 15px;
            padding: 12px;
            background: #212332;
            border-radius: 8px;
          }
          
          .requirements p {
            color: #a0a0b0;
            font-size: 12px;
            margin: 5px 0;
          }
          
          .requirements ul {
            margin-left: 20px;
            margin-top: 5px;
          }
          
          .requirements li {
            color: #a0a0b0;
            font-size: 12px;
            margin: 3px 0;
          }
          
          .icon {
            font-size: 50px;
            margin-bottom: 20px;
          }
          
          hr {
            border-color: #3a3d4e;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          ${isValid ? `
            <div class="icon">🔐</div>
            <h1>Reset Your Password</h1>
            <p style="color: #a0a0b0; margin-bottom: 25px;">Please enter your new password below</p>
            
            <form id="resetForm">
              <div class="input-group">
                <label>New Password</label>
                <input type="password" id="password" placeholder="Enter new password" required minlength="6">
              </div>
              
              <div class="input-group">
                <label>Confirm Password</label>
                <input type="password" id="confirmPassword" placeholder="Confirm new password" required minlength="6">
              </div>
              
              <button type="submit" id="submitBtn">Reset Password</button>
              <div id="message" class="message"></div>
            </form>
            
            <div class="requirements">
              <p><strong>Password Requirements:</strong></p>
              <ul>
                <li>Minimum 6 characters long</li>
                <li>Use a mix of letters and numbers</li>
                <li>Avoid common passwords</li>
              </ul>
            </div>
            
            <hr>
            <a href="${ADMIN_URL}/login" class="back-link">← Back to Login</a>
            
            <script>
              // Use BACKEND_URL for API calls
              const API_BASE_URL = '${BACKEND_URL}';
              // Use ADMIN_URL for frontend redirects
              const ADMIN_BASE_URL = '${ADMIN_URL}';
              const resetToken = '${token}';
              
              document.getElementById('resetForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const messageDiv = document.getElementById('message');
                const submitBtn = document.getElementById('submitBtn');
                
                // Clear previous message
                messageDiv.innerHTML = '';
                messageDiv.className = 'message';
                
                // Validate passwords match
                if (password !== confirmPassword) {
                  messageDiv.innerHTML = '<span class="error">❌ Passwords do not match!</span>';
                  messageDiv.style.background = 'rgba(255,107,107,0.1)';
                  return;
                }
                
                // Validate password length
                if (password.length < 6) {
                  messageDiv.innerHTML = '<span class="error">❌ Password must be at least 6 characters!</span>';
                  messageDiv.style.background = 'rgba(255,107,107,0.1)';
                  return;
                }
                
                // Disable button and show loading
                submitBtn.disabled = true;
                submitBtn.textContent = 'Resetting Password...';
                messageDiv.innerHTML = '<span style="color: #667eea;">⏳ Resetting your password...</span>';
                messageDiv.style.background = 'rgba(102,126,234,0.1)';
                
                try {
                  const response = await fetch(API_BASE_URL + '/users/reset-password/' + resetToken, {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password, confirmPassword })
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    messageDiv.innerHTML = '<span class="success">✅ ' + data.message + '</span>';
                    messageDiv.style.background = 'rgba(81,207,102,0.1)';
                    submitBtn.textContent = 'Success! Redirecting...';
                    
                    // Redirect to admin login page after 3 seconds
                    setTimeout(() => {
                      window.location.href = ADMIN_BASE_URL + '/login';
                    }, 3000);
                  } else {
                    messageDiv.innerHTML = '<span class="error">❌ ' + data.message + '</span>';
                    messageDiv.style.background = 'rgba(255,107,107,0.1)';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Reset Password';
                  }
                } catch (error) {
                  console.error('Reset error:', error);
                  messageDiv.innerHTML = '<span class="error">❌ Network error. Please check your connection and try again.</span>';
                  messageDiv.style.background = 'rgba(255,107,107,0.1)';
                  submitBtn.disabled = false;
                  submitBtn.textContent = 'Reset Password';
                }
              });
              
              // Add real-time password match validation
              const confirmInput = document.getElementById('confirmPassword');
              const passwordInput = document.getElementById('password');
              
              function validateMatch() {
                if (confirmInput.value && passwordInput.value !== confirmInput.value) {
                  confirmInput.style.borderColor = '#ff6b6b';
                } else {
                  confirmInput.style.borderColor = '#3a3d4e';
                }
              }
              
              passwordInput.addEventListener('input', validateMatch);
              confirmInput.addEventListener('input', validateMatch);
            </script>
          ` : `
            <div class="icon">⚠️</div>
            <h1 class="error">Invalid or Expired Link</h1>
            <p style="color: #a0a0b0; margin: 20px 0;">The password reset link is invalid or has expired.</p>
            <p style="color: #a0a0b0; font-size: 14px;">This can happen if:</p>
            <div class="requirements" style="text-align: left; margin: 15px 0;">
              <ul>
                <li>The link has been used already</li>
                <li>More than 1 hour has passed since the request</li>
                <li>The link was tampered with</li>
              </ul>
            </div>
            <a href="${ADMIN_URL}/forgot-password" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
              Request New Reset Link
            </a>
            <br/>
            <a href="${ADMIN_URL}/login" class="back-link">← Back to Login</a>
          `}
        </div>
      </body>
    </html>
  `;

    if (!user) {
      return res.status(400).send(getResetPasswordPage(token, false));
    }

    res.status(200).send(getResetPasswordPage(token, true));
  }),
);
// ─── Register ──────────────────────────────────────────────────────────────────
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, phone, password, role, location } = req.body;

    if (!name || !email || !phone || !password || !location) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, location, and password are required.",
      });
    }
    if (!location || location.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Location is required",
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

    const user = new User({
      name,
      email,
      phone,
      location,
      password: hashedPassword,
      role: role || "user",
      verificationToken,
      verificationTokenExpires,
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
      return res.status(403).json({
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
    // await user.save(); //this can cause issue if admin is created previously and also with user
    await User.findByIdAndUpdate(user._id, {
      refreshToken: refreshToken,
    });
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
router.post(
  "/refresh-token",
  asyncHandler(async (req, res) => {
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
      { expiresIn: "15m" },
    );

    res.json({
      accessToken: newAccessToken,
    });
  }),
);
// ─── Forgot Password - Request Reset ──────────────────────────────────────────
router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    // For security, always return success even if user doesn't exist
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with that email, you will receive a password reset link.",
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before requesting a password reset.",
      });
    }

    // ✅ Check if user has successfully reset password within last 24 hours
    if (user.passwordResetRequests?.lastResetDate) {
      const hoursSinceLastReset = (Date.now() - new Date(user.passwordResetRequests.lastResetDate).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastReset < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceLastReset);
        return res.status(429).json({
          success: false,
          message: `You recently reset your password. Please wait ${remainingHours} hours before requesting another reset.`,
        });
      }
    }

    // ✅ Initialize or get existing rate limit data
    let resetRequests = user.passwordResetRequests || {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Check if firstRequestDate exists and if it's from today
    if (resetRequests.firstRequestDate) {
      const requestDate = new Date(resetRequests.firstRequestDate);
      requestDate.setHours(0, 0, 0, 0);
      
      // If request date is not today, reset the counter
      if (requestDate.getTime() !== today.getTime()) {
        resetRequests = {
          count: 0,
          firstRequestDate: today,
          lastResetDate: resetRequests.lastResetDate
        };
      }
    } else {
      // First request ever
      resetRequests.firstRequestDate = today;
    }

    // ✅ Check if user has exceeded 3 requests per day
    if (resetRequests.count >= 3) {
      return res.status(429).json({
        success: false,
        message: "You have exceeded the maximum of 3 password reset requests per day. Please try again tomorrow.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    // ✅ Update user with rate limiting data
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpires,
          'passwordResetRequests.count': (resetRequests.count + 1),
          'passwordResetRequests.firstRequestDate': resetRequests.firstRequestDate,
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to update user with reset token.",
      });
    }

    try {
      await sendPasswordResetEmail(user.email, resetToken);
      
      res.status(200).json({
        success: true,
        message: "Password reset link has been sent to your email address.",
        remainingAttempts: 3 - (resetRequests.count + 1)
      });
    } catch (emailError) {
      // Clear reset token and decrement count if email fails
      await User.findByIdAndUpdate(
        user._id,
        {
          $unset: {
            resetPasswordToken: "",
            resetPasswordExpires: "",
          },
          $inc: {
            'passwordResetRequests.count': -1 // Decrement count on failure
          }
        }
      );
      
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
      });
    }
  }),
);
// ─── Reset Password - Verify Token and Reset ──────────────────────────────────
router.post(
  "/reset-password/:token",
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validation checks
    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password are required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired. Please request a new one.",
      });
    }

    // ✅ Check if user has already reset password within last 24 hours
    if (user.passwordResetRequests?.lastResetDate) {
      const hoursSinceLastReset = (Date.now() - new Date(user.passwordResetRequests.lastResetDate).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastReset < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceLastReset);
        return res.status(429).json({
          success: false,
          message: `You have already reset your password. Please wait ${remainingHours} hours before resetting again.`,
        });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // ✅ Update using updateOne with cooldown tracking
    const result = await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          refreshToken: null,
          'passwordResetRequests.lastResetDate': new Date(), // Track last reset
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: "",
        }
      }
    );

    // Check if update was successful
    if (result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to reset password. Please try again.",
      });
    }

    // Optional: Send confirmation email
    // await sendPasswordChangeConfirmationEmail(user.email);

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  }),
);
// ─── Verify Reset Token ───────────────────────────────────────────────────────
router.get(
  "/verify-reset-token/:token",
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid.",
    });
  }),
);
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

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const { userId } = req.body;

    await User.findByIdAndUpdate(userId, {
      refreshToken: null,
    });

    res.json({ message: "Logged out successfully" });
  }),
);

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
