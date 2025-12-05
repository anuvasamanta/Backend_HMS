
const jwt = require("jsonwebtoken");
const redis = require("../config/radis");

const cookieRoleMap = {
  admin: "adminToken",
  staff: "staffToken",
  doctor: "doctorToken",
  nurse: "nurseToken",
};

const secretMap = {
  admin: process.env.ADMIN_SECRET || "hellowelcomadmin",
  staff: process.env.STAFF_SECRET || "hellowelcomestaff",
  doctor: process.env.DOCTOR_SECRET || "hellowelcomedoctor123",
  nurse: process.env.NURSE_SECRET || "hellowelcomnurse",
};

module.exports = async (req, res, next) => {
  try {
    let role = null;

    // Detect role by route
    if (req.path.startsWith("/admin")) role = "admin";
    else if (req.path.startsWith("/staff")) role = "staff";
    else if (req.path.startsWith("/doctor")) role = "doctor";
    else if (req.path.startsWith("/nurse")) role = "nurse";

    // No role route → do nothing
    if (!role) {
      res.locals.user = null;
      return next();
    }

    const cookieName = cookieRoleMap[role];
    const token = req.cookies?.[cookieName];

    if (!token) {
      res.locals.user = null;
      return next();
    }

    const decoded = jwt.verify(token, secretMap[role]);

    const sessionKey = `session:${role}:${decoded.id}`;
    const sessionStr = await redis.get(sessionKey);

    if (!sessionStr) {
      res.locals.user = null;
      return next();
    }

    res.locals.user = JSON.parse(sessionStr);  
    res.locals.user.role = role;

    return next();

  } catch (err) {
    console.error("checkUser middleware error:", err);
    res.locals.user = null;
    next();
  }
};
