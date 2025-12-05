const jwt = require("jsonwebtoken");

const patientAuthCheck = (req, res, next) => {
  // Try to read token from header first
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // Fallback: try cookie
  if (!token) {
    token = req.cookies?.patientToken;
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const secretKey = process.env.JWT_SECRECT || "hellowelcometowebskittersacademy123456";
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();

  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = patientAuthCheck;

