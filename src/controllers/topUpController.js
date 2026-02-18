const TopUp = require('../models/TopUp');
const App = require('../models/App');
const User = require('../models/userModel');
const WalletTransaction = require('../models/WalletTransaction');
const bcrypt = require('bcryptjs');

// ==================== USER (AGENT) ENDPOINTS ====================

// @desc    Create a top-up request (Points move to Admin)
// @route   POST /api/topup
// @access  Private
exports.createTopUp = async (req, res) => {
    try {
        const userId = req.user._id;
        const { appId, targetUserId, targetUserName, amount, walletType, agentCode, walletPassword } = req.body;

        // Basic Validation
        if (!appId || !targetUserId || !targetUserName || !amount || !agentCode || !walletPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields including wallet password are required'
            });
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

        // 2. Check Sufficient Balance
        if (req.user.points < amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. You have ${req.user.points} points.`
            });
        }

        // 3. Find Admin to receive points
        const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
        if (!admin) {
            return res.status(500).json({
                success: false,
                message: 'Admin account not found'
            });
        }

        // 4. Perform Deduction from User (Hold points)
        await User.findByIdAndUpdate(userId, { $inc: { points: -amount } });

        // 5. Create TopUp Record
        const topUp = await TopUp.create({
            userId,
            appId,
            targetUserId,
            targetUserName,
            amount,
            walletType: walletType || 'Main Wallet',
            agentCode,
            status: 'Pending'
        });

        // 6. Record Wallet Transactions (User Only)
        const userTx = await WalletTransaction.create({
            userId: userId,
            transactionType: 'withdrawal', 
            amount: -amount,
            description: `Top-Up Request (Pending) - App: ${app.appName}, Target: ${targetUserId}`,
            relatedId: topUp._id,
            relatedModel: 'TopUp',
        });

        // Note: Admin transaction is created ONLY on approval
        topUp.transactionId = userTx._id;
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
            // Transfer to Admin only on approval
            const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
            if (admin) {
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
            }
        } else if (status === 'Rejected') {
            // Return points back to User
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
