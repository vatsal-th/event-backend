const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            if (req.user.isActive === false) {
                return res.status(403).json({ message: 'Your account is inactive' });
            }

            next();
        } catch (error) {
            console.log(error);
            res.status(401).json({ message: 'Not authorized' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
};

const authorizePermissions = (...permissions) => {
    return (req, res, next) => {
        if (req.user && (req.user.role === 'admin' || permissions.some(perm => req.user.permissions.includes(perm)))) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
    };
};

module.exports = { protect, authorizeAdmin, authorizePermissions };
