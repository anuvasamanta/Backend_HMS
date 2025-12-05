
const jwt = require("jsonwebtoken");
const flash = require('connect-flash');

// Generic middleware generator for each role
function verifyToken(role) {
  return (req, res, next) => {
    let token = null;
    // Read cookie based on role
    if (role === "patient") token = req.cookies.patientToken;
    if (role === "doctor") token = req.cookies.doctorToken;
    if (role === "nurse") token = req.cookies.nurseToken;
    if (role === "staff") token = req.cookies.staffToken;
    if (role === "admin") token = req.cookies.adminToken;

    if (!token) {
      req.flash('error', 'Unauthorized: Token missing. Please Login First');
      return res.redirect('/staff-login'); // Only one response
    }

    let secret = "";
    if (role === "patient") secret = process.env.JWT_SECRET || 'hellowelcometowebskittersacademy123456';
    if (role === "doctor") secret = process.env.JWT_SECRECT_DOCTOR || 'hellowelcomedoctor123';
    if (role === "nurse") secret = process.env.JWT_SECRECT_NURSE || 'hellowelcomnurse';
    if (role === "staff") secret = process.env.JWT_SECRECT_STAFF || 'hellowelcomestaff';
    if (role === "admin") secret = process.env.JWT_SECRECT_ADMIN || 'hellowelcomadmin';

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        req.flash('error', 'Invalid token. Please Login First');
        return res.redirect('/staff-login'); // Only one response
      }
      req.user = decoded; // Store decoded user info
      next();
    });
  };
}

module.exports = verifyToken;