const jwt = require("jsonwebtoken");
const { BlacklistedToken } = require("../models/BlacklistedToken");

async function verifyToken(req, res, next) {
    const token = req.headers.token;

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {

        const isBlacklisted = await BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
            return res.status(401).json({ message: "Token is blacklisted (logged out)" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
  module.exports = { verifyToken }