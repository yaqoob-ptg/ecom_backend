const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../model/user");
const { verifySuperAdmin } = require("../middleware/superAdminMiddleware");
const Order = require('../model/order');




// Helper: build date filter from period string
function buildDateFilter(period) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
 
  switch (period) {
    case 'today':
      return { $gte: today };
    case 'week': {
      const dayOfWeek = now.getDay() || 7; // Mon=1 … Sun=7
      const monday    = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek - 1));
      return { $gte: monday };
    }
    case 'month':
      return { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    default:
      return undefined; // overall — no filter
  }
}
// ============ PUBLIC SUPER ADMIN ROUTES (No auth required) ============

// Super Admin Login (no auth needed)
router.post("/secure-login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Email and password are required." 
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || user.role !== "superAdmin") {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials." 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials." 
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before accessing super admin panel."
      });
    }

    const jwt = require("jsonwebtoken");
    const accessToken = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await User.findByIdAndUpdate(user._id, {
      refreshToken: refreshToken,
      lastLoginAt: new Date(),
      lastLoginIp: req.ip || req.connection.remoteAddress
    });

    const { password: _, refreshToken: __, ...userData } = user.toObject();

    res.status(200).json({
      success: true,
      message: "Super admin login successful.",
      accessToken,
      refreshToken,
      data: userData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ PROTECTED SUPER ADMIN ROUTES (Auth required) ============

// Apply auth middleware to all routes below
router.use(verifySuperAdmin);


// System statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      byRole: {
        users: await User.countDocuments({ role: "user" }),
        admins: await User.countDocuments({ role: "admin" }),
        superAdmins: await User.countDocuments({ role: "superAdmin" }),
        guests: await User.countDocuments({ role: "guest" })
      },
      verified: await User.countDocuments({ isVerified: true }),
      unverified: await User.countDocuments({ isVerified: false })
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Add this to your superAdminRoutes.js

// Get sales statistics per admin
router.get("/sales-per-admin", async (req, res) => {
  try {
    // Get all admins (users with role 'admin')
    const admins = await User.find({ role: "admin" }).select("_id name email");
    
    // You'll need to import your Order model
    const Order = require("../model/order");
    
    const salesPerAdmin = await Promise.all(
      admins.map(async (admin) => {
        const sales = await Order.aggregate([
          { $match: { adminId: admin._id, status: "delivered" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]);
        
        return {
          adminId: admin._id,
          adminName: admin.name,
          adminEmail: admin.email,
          totalSales: sales.length > 0 ? sales[0].total : 0,
          orderCount: sales.length > 0 ? sales[0].count : 0
        };
      })
    );
    
    // Calculate overall totals
    const totalSales = salesPerAdmin.reduce((sum, admin) => sum + admin.totalSales, 0);
    const totalOrders = salesPerAdmin.reduce((sum, admin) => sum + admin.orderCount, 0);
    
    res.json({
      success: true,
      data: {
        salesPerAdmin,
        summary: {
          totalSales,
          totalOrders,
          activeAdmins: admins.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get recent users (limit parameter)
router.get("/users/recent/:limit?", async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 5;
    
    const users = await User.find({ role: { $ne: "superAdmin" } })
      .select("-password -refreshToken -verificationToken")
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalSuperAdmins = await User.countDocuments({ role: "superAdmin" });
    const totalGuests = await User.countDocuments({ role: "guest" });
    
    res.json({
      success: true,
      data: {
        admin: { name: req.user.name, email: req.user.email },
        statistics: { totalUsers, totalAdmins, totalSuperAdmins, totalGuests }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all users with filters
router.get("/users", async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    let filter = {};
    if (role) filter.role = role;
    
    const users = await User.find(filter)
      .select("-password -refreshToken -verificationToken")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: { users, totalPages: Math.ceil(total / limit), currentPage: page }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single user
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -refreshToken");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ─── GET /super-admin/sales/summary ─────────────────────────────────────────
// Returns overall KPI numbers for the chosen period
router.get('/sales/summary', async (req, res) => {
  try {
    const { period = 'overall' } = req.query;
    const dateFilter = buildDateFilter(period);
    const match = dateFilter ? { orderDate: dateFilter } : {};
 
    const [result] = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue:    { $sum: '$orderTotal.total' },
          totalOrders:     { $sum: 1 },
          pendingOrders:   { $sum: { $cond: [{ $eq: ['$orderStatus', 'pending']   }, 1, 0] } },
          shippedOrders:   { $sum: { $cond: [{ $eq: ['$orderStatus', 'shipped']   }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] } },
        },
      },
    ]);
 
    // Today sub-query
    const todayFilter = { orderDate: buildDateFilter('today') };
    const [todayResult] = await Order.aggregate([
      { $match: todayFilter },
      { $group: { _id: null, todayRevenue: { $sum: '$orderTotal.total' }, todayOrders: { $sum: 1 } } },
    ]);
 
    res.json({
      success: true,
      data: {
        ...( result || {
          totalRevenue: 0, totalOrders: 0,
          pendingOrders: 0, shippedOrders: 0,
          deliveredOrders: 0, cancelledOrders: 0,
        }),
        todayRevenue: todayResult?.todayRevenue ?? 0,
        todayOrders:  todayResult?.todayOrders  ?? 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// ─── GET /super-admin/sales/by-admin ────────────────────────────────────────
// Sales totals grouped by admin, with status breakdown
router.get('/sales/by-admin', async (req, res) => {
  try {
    const { period = 'overall' } = req.query;
    const dateFilter = buildDateFilter(period);
    const match = dateFilter ? { orderDate: dateFilter } : {};
 
    const rows = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$adminId',
          totalSales:     { $sum: '$orderTotal.total' },
          orderCount:     { $sum: 1 },
          pendingOrders:  { $sum: { $cond: [{ $eq: ['$orderStatus', 'pending']   }, 1, 0] } },
          shippedOrders:  { $sum: { $cond: [{ $eq: ['$orderStatus', 'shipped']   }, 1, 0] } },
          deliveredOrders:{ $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
          cancelledOrders:{ $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] } },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);
 
    // Enrich with admin name/email
    const adminIds = rows.map(r => r._id).filter(Boolean);
    const admins   = await User.find({ _id: { $in: adminIds } }).select('name email');
    const adminMap = Object.fromEntries(admins.map(a => [a._id.toString(), a]));
 
    const data = rows.map(r => ({
      adminId:        r._id?.toString() ?? 'unknown',
      adminName:      adminMap[r._id?.toString()]?.name  ?? 'Unknown Admin',
      adminEmail:     adminMap[r._id?.toString()]?.email ?? '',
      totalSales:     r.totalSales,
      orderCount:     r.orderCount,
      pendingOrders:  r.pendingOrders,
      shippedOrders:  r.shippedOrders,
      deliveredOrders:r.deliveredOrders,
      cancelledOrders:r.cancelledOrders,
    }));
 
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// ─── GET /super-admin/sales/by-product ──────────────────────────────────────
// Sales totals grouped by product, with admin name
router.get('/sales/by-product', async (req, res) => {
  try {
    const { period = 'overall', limit = 50 } = req.query;
    const dateFilter = buildDateFilter(period);
    const match = dateFilter ? { orderDate: dateFilter } : {};
 
    const rows = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            productId:   '$items.productID',
            productName: '$items.productName',
            adminId:     '$adminId',
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue:  { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount:    { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
    ]);
 
    const adminIds = [...new Set(rows.map(r => r._id.adminId?.toString()).filter(Boolean))];
    const admins   = await User.find({ _id: { $in: adminIds } }).select('name');
    const adminMap = Object.fromEntries(admins.map(a => [a._id.toString(), a.name]));
 
    const data = rows.map(r => ({
      productId:     r._id.productId?.toString() ?? '',
      productName:   r._id.productName ?? 'Unknown',
      adminName:     adminMap[r._id.adminId?.toString()] ?? 'Unknown Admin',
      totalQuantity: r.totalQuantity,
      totalRevenue:  r.totalRevenue,
      orderCount:    r.orderCount,
    }));
 
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Approve / unapprove an admin
router.put("/users/:id/approve", async (req, res) => {
  try {
    const { isApproved } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (targetUser.role === "superAdmin") {
      return res.status(403).json({ success: false, message: "Cannot modify super admin." });
    }
    if (targetUser.role !== "admin") {
      return res.status(400).json({ success: false, message: "Approval is only for admin accounts." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved, updatedAt: Date.now() },
      { new: true }
    ).select("-password -refreshToken");

    res.json({ success: true, message: `Admin ${isApproved ? 'approved' : 'unapproved'}.`, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
 
// Toggle active status (block/unblock) + force logout
router.put("/users/:id/toggle-active", async (req, res) => {
  try {
    const { isActive } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (targetUser.role === "superAdmin") {
      return res.status(403).json({ success: false, message: "Cannot block super admin." });
    }

    const updateData = {
      isActive,
      updatedAt: Date.now(),
      deactivatedAt: isActive ? null : new Date(),
      deactivationReason: isActive ? null : 'Blocked by super admin',
    };

    // Force logout by invalidating refresh token
    if (!isActive) {
      updateData.refreshToken = null;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password -refreshToken");

    res.json({
      success: true,
      message: `User ${isActive ? 'unblocked' : 'blocked and logged out'}.`,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Update user role
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["user", "admin", "guest"];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }
    
    const targetUser = await User.findById(req.params.id);
    if (targetUser.role === "superAdmin") {
      return res.status(403).json({ success: false, message: "Cannot modify super admin." });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role, updatedAt: Date.now() },
      { new: true }
    ).select("-password -refreshToken");
    
    res.json({ success: true, message: "Role updated.", data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    
    if (targetUser.role === "superAdmin") {
      return res.status(403).json({ success: false, message: "Cannot delete super admin." });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Force logout user
router.post("/users/:id/logout", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { refreshToken: null });
    res.json({ success: true, message: "User logged out from all devices." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;