const TopUp = require('../models/TopUp');
const App = require('../models/App');
const User = require('../models/userModel');
const WalletTransaction = require('../models/WalletTransaction');
const TopUpSettings = require('../models/TopUpSettings');
const bcrypt = require('bcryptjs');

// ==================== SETTINGS (ADMIN) ====================

// @desc    Update Top-Up QR Code (Admin only)
// @route   POST /api/topups/admin/qr
// @access  Private (Admin)
exports.updateTopUpQR = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a photo' });
        }

        let settings = await TopUpSettings.findOne();
        if (settings) {
            settings.qrCode = req.file.path;
            settings.updatedBy = req.user._id;
            await settings.save();
        } else {
            settings = await TopUpSettings.create({
                qrCode: req.file.path,
                updatedBy: req.user._id
            });
        }

        res.status(200).json({
            success: true,
            message: 'Top-up QR code updated successfully',
            data: settings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete Top-Up QR Code (Admin only)
// @route   DELETE /api/topups/admin/qr
// @access  Private (Admin)
exports.deleteTopUpQR = async (req, res) => {
    try {
        const settings = await TopUpSettings.findOne();
        if (!settings) {
            return res.status(404).json({ success: false, message: 'QR code settings not found' });
        }

        await TopUpSettings.deleteOne({ _id: settings._id });

        res.status(200).json({
            success: true,
            message: 'Top-up QR code deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== USER (AGENT) ENDPOINTS ====================

// @desc    Get Top-Up QR Code
// @route   GET /api/topups/qr
// @access  Private
exports.getTopUpQR = async (req, res) => {
    try {
        const settings = await TopUpSettings.findOne();
        if (!settings) {
            return res.status(404).json({ success: false, message: 'QR code not found' });
        }
        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all active apps for top-up selection
// @route   GET /api/topup/apps
// @access  Private
exports.getApps = async (req, res) => {
    try {
        const apps = await App.find({ status: 'active' }).select('appName');
        res.status(200).json({
            success: true,
            data: apps
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a top-up request (Points move to Admin)
// @route   POST /api/topup
// @access  Private
exports.createTopUp = async (req, res) => {
    try {
        const userId = req.user._id;
        const { appId, targetUserId, targetUserName, amount, walletType, agentCode, walletPassword, paymentMethod, utrNumber } = req.body;

        // Basic Validation
        if (!appId || !targetUserId || !targetUserName || !amount || !agentCode || !walletPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields including wallet password are required'
            });
        }

        if (paymentMethod === 'Cash') {
            if (!utrNumber || !req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'UTR Number and payment proof photo are required for Cash payments'
                });
            }
        }

        // Verify App exists
        const app = await App.findById(appId);
        if (!app) {
            return res.status(404).json({
                success: false,
                message: 'Selected app not found'
            });
        }

        // 1. Verify Wallet Password
        const userWithPassword = await User.findById(userId).select('+walletPassword');
        if (!userWithPassword.walletPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please set a wallet password before performing a top-up'
            });
        }

        const isMatch = await bcrypt.compare(walletPassword, userWithPassword.walletPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect wallet password'
            });
        }

        // 2. Check Sufficient Balance (Only if using Main Wallet)
        if (paymentMethod !== 'Cash') {
            if (req.user.points < amount) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient balance. You have ${req.user.points} points.`
                });
            }
        }

        // 3. Find Admin to receive points
        const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
        if (!admin) {
            return res.status(500).json({
                success: false,
                message: 'Admin account not found'
            });
        }

        // 4. Perform Deduction from User (Hold points) - Skip for Cash
        if (paymentMethod !== 'Cash') {
            await User.findByIdAndUpdate(userId, { $inc: { points: -amount } });
        }

        // 5. Create TopUp Record
        const topUp = await TopUp.create({
            userId,
            appId,
            targetUserId,
            targetUserName,
            amount,
            paymentMethod: paymentMethod || 'Main Wallet',
            utrNumber: utrNumber || (paymentMethod === 'Main Wallet' ? `WAL-${Math.floor(100000 + Math.random() * 900000)}` : undefined),
            paymentProof: (paymentMethod === 'Cash' && req.file) ? req.file.path : undefined,
            walletType: walletType || 'Main Wallet',
            agentCode,
            status: 'Pending'
        });

        // 6. Record Wallet Transactions (User Only) - Skip for Cash
        let userTx;
        if (paymentMethod !== 'Cash') {
            userTx = await WalletTransaction.create({
                userId: userId,
                transactionType: 'withdrawal', 
                amount: -amount,
                description: `Top-Up Request (Pending) - App: ${app.appName}, Target: ${targetUserId}`,
                relatedId: topUp._id,
                relatedModel: 'TopUp',
            });
            topUp.transactionId = userTx._id;
        }
        await topUp.save();

        res.status(201).json({
            success: true,
            message: 'Top-up submitted successfully. Points deducted and waiting for admin approval.',
            data: topUp
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get current user's top-up history
// @route   GET /api/topup/history
// @access  Private
exports.getUserTopUps = async (req, res) => {
    try {
        const topUps = await TopUp.find({ userId: req.user._id })
            .populate('appId', 'appName')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: topUps
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== ADMIN ENDPOINTS ====================

// @desc    Get all top-up requests for admin
// @route   GET /api/admin/topups
// @access  Private (Admin)
exports.getAllTopUps = async (req, res) => {
    try {
        const topUps = await TopUp.find()
            .populate('userId', 'fullName email points')
            .populate('appId', 'appName')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: topUps
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Approve/Reject Top-Up (for status tracking)
// @route   PUT /api/admin/topups/:id
// @access  Private (Admin)
exports.updateTopUpStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const topUp = await TopUp.findById(req.params.id);

        if (!topUp) {
            return res.status(404).json({ success: false, message: 'Top-up request not found' });
        }

        if (topUp.status !== 'Pending') {
            return res.status(400).json({ success: false, message: `Request already ${topUp.status}` });
        }

        if (status === 'Approved') {
            // Transfer to Admin only on approval (For Main Wallet transactions)
            const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
            if (admin && topUp.paymentMethod !== 'Cash') {
                await User.findByIdAndUpdate(admin._id, { $inc: { points: topUp.amount } });
                
                // Create Admin Credit Transaction
                await WalletTransaction.create({
                    userId: admin._id,
                    transactionType: 'admin_adjustment',
                    amount: topUp.amount,
                    description: `Top-Up Approved - Received from ${topUp.userId}`,
                    relatedId: topUp._id,
                    relatedModel: 'TopUp',
                });
            } else if (topUp.paymentMethod === 'Cash') {
                // For cash, admin already has money physically. 
                // Maybe we want to log it?
                console.log(`Cash Top-Up Approved for UTR: ${topUp.utrNumber}`);
            }
        } else if (status === 'Rejected') {
            // Return points back to User (Only if it was deducted from wallet)
            if (topUp.paymentMethod !== 'Cash') {
                await User.findByIdAndUpdate(topUp.userId, { $inc: { points: topUp.amount } });
                
                // Create User Refund Transaction
                await WalletTransaction.create({
                    userId: topUp.userId,
                    transactionType: 'withdrawal_refund',
                    amount: topUp.amount,
                    description: `Top-Up Rejected - Points refunded to your wallet`,
                    relatedId: topUp._id,
                    relatedModel: 'TopUp',
                });
            }
        }

        topUp.status = status;
        topUp.processedBy = req.user._id;
        topUp.processedAt = Date.now();
        await topUp.save();

        res.status(200).json({
            success: true,
            message: `Top-up ${status} successfully`,
            data: topUp
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
