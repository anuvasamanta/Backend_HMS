const jwt = require('jsonwebtoken');

const doctorAuthCheck = async (req, res, next) => {
    const token = req.cookies.doctorToken;

    if (!token) {
        // Set flash message
        req.flash('error', 'Token is required to access this page');
        return res.redirect('/staff-login'); // redirect to login
    }

    try {
        const secretKey = process.env.JWT_SECRECT_DOCTOR || "hellowelcomedoctor123";
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // attach decoded token data to request
        next();
    } catch (err) {
        // Set flash message for invalid token
        req.flash('error', 'Invalid token. Please login again.');
        return res.redirect('/staff-login');
    }
};

module.exports = doctorAuthCheck;
