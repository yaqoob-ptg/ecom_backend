
// const User = require('../model/user');
// const jwt = require('jsonwebtoken');

// const verifySuperAdmin = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
  
//   if (!token) {
//     return res.status(401).json({ success: false, message: "Authentication required" });
//   }
  
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Always re-fetch from database - never trust token role alone
//     const user = await User.findById(decoded._id);
    
//     if (!user || !user.isActive) {
//       return res.status(403).json({ success: false, message: "Account deactivated" });
//     }
    
//     if (user.role !== 'superAdmin') {
//       // Log this suspicious activity
//       console.error(`Non-super admin ${user.email} attempted to access super admin endpoint`);
//       return res.status(403).json({ success: false, message: "Super admin access required" });
//     }
    
//     if (user.isLocked()) {
//       return res.status(423).json({ 
//         success: false, 
//         message: "Account locked due to multiple failed attempts" 
//       });
//     }
    
//     // Attach user to request
//     req.superAdmin = user;
//     next();
//   } catch (error) {
//     return res.status(401).json({ success: false, message: "Invalid or expired token" });
//   }
// };

// // Optional: Restrict super admin login to specific IPs
// const restrictSuperAdminIP = (allowedIPs) => {
//   return (req, res, next) => {
//     const clientIp = req.ip || req.connection.remoteAddress;
    
//     if (allowedIPs && allowedIPs.length > 0 && !allowedIPs.includes(clientIp)) {
//       console.error(`Super admin login blocked from IP: ${clientIp}`);
//       return res.status(403).json({ 
//         success: false, 
//         message: "Access restricted from this IP address" 
//       });
//     }
    
//     next();
//   };
// };

// module.exports = { verifySuperAdmin, restrictSuperAdminIP };

const User = require('../model/user');
const jwt = require('jsonwebtoken');

const verifySuperAdmin = async (req, res, next) => {
  // Get token directly from authorization header (no Bearer prefix expected)
  const token = req.headers.authorization;
  
  console.log('🔐 Auth header received:', token ? `${token.substring(0, 30)}...` : 'No token');
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified for user ID:', decoded._id);
    
    // Always re-fetch from database - never trust token role alone
    const user = await User.findById(decoded._id);
    
    if (!user || !user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated" });
    }
    
    if (user.role !== 'superAdmin') {
      // Log this suspicious activity
      console.error(`Non-super admin ${user.email} attempted to access super admin endpoint`);
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }
    
    if (user.isLocked && user.isLocked()) {
      return res.status(423).json({ 
        success: false, 
        message: "Account locked due to multiple failed attempts" 
      });
    }
    
    // Attach user to request
    req.superAdmin = user;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Optional: Restrict super admin login to specific IPs
const restrictSuperAdminIP = (allowedIPs) => {
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs && allowedIPs.length > 0 && !allowedIPs.includes(clientIp)) {
      console.error(`Super admin login blocked from IP: ${clientIp}`);
      return res.status(403).json({ 
        success: false, 
        message: "Access restricted from this IP address" 
      });
    }
    
    next();
  };
};

module.exports = { verifySuperAdmin, restrictSuperAdminIP };