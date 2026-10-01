const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Access Denied. No Token Provided."
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or Expired Token."
        });

    }

};

const authorizeAdmin = (req, res, next) => {

    if (req.user.role !== "Admin") {

        return res.status(403).json({
            message: "Access Denied. Admin Only."
        });

    }

    next();

};

module.exports = { authenticateUser, authorizeAdmin };