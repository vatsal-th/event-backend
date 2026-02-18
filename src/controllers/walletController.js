const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

// @desc    Get user's wallet transaction history
// @route   GET /api/wallet/transactions
// @access  Private
exports.getWalletTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get transactions with pagination and populate related data
        const transactions = await WalletTransaction.find({ userId })
            .populate('relatedId')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalCount = await WalletTransaction.countDocuments({ userId });

        // Calculate total earned
        const allTransactions = await WalletTransaction.find({ userId });
        const totalEarned = allTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

        const totalSpent = allTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        res.status(200).json({
            success: true,
            data: {
                currentBalance: req.user.points,
                totalEarned,
                totalSpent,
                transactions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalRecords: totalCount,
                    recordsPerPage: limit,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get wallet summary/stats
// @route   GET /api/wallet/summary
// @access  Private
exports.getWalletSummary = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all transactions
        const transactions = await WalletTransaction.find({ userId });

        // Calculate stats by transaction type
        const stats = {
            referralRewards: 0,
            applicationRewards: 0,
            withdrawals: 0,
            adminAdjustments: 0,
            topUpsSent: 0,
            topUpsReceived: 0,
        };

        transactions.forEach(transaction => {
            if (transaction.relatedModel === 'TopUp') {
                if (transaction.amount > 0) {
                    stats.topUpsReceived += transaction.amount;
                } else {
                    stats.topUpsSent += Math.abs(transaction.amount);
                }
            } else {
                switch (transaction.transactionType) {
                    case 'referral_reward':
                        stats.referralRewards += transaction.amount;
                        break;
                    case 'application_reward':
                        stats.applicationRewards += transaction.amount;
                        break;
                    case 'withdrawal':
                        stats.withdrawals += Math.abs(transaction.amount);
                        break;
                    case 'admin_adjustment':
                        stats.adminAdjustments += transaction.amount;
                        break;
                }
            }
        });

        // totalEarned: Points coming IN (Rewards + Admin Credits + TopUps Received)
        const totalEarned = stats.referralRewards + stats.applicationRewards + stats.topUpsReceived + (stats.adminAdjustments > 0 ? stats.adminAdjustments : 0);
        
        // totalSpent: Points going OUT (Withdrawals + TopUps Sent + Admin Debits)
        const totalSpent = stats.withdrawals + stats.topUpsSent + (stats.adminAdjustments < 0 ? Math.abs(stats.adminAdjustments) : 0);

        res.status(200).json({
            success: true,
            data: {
                currentBalance: req.user.points,
                totalEarned,
                totalSpent,
                breakdown: stats,
                totalTransactions: transactions.length,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get transactions by type
// @route   GET /api/wallet/transactions/:type
// @access  Private
exports.getTransactionsByType = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type } = req.params;

        const validTypes = ['referral_reward', 'application_reward', 'withdrawal', 'admin_adjustment'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction type'
            });
        }

        const transactions = await WalletTransaction.find({
            userId,
            transactionType: type
        })
            .populate('relatedId')
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();

        const total = transactions.reduce((sum, t) => sum + t.amount, 0);

        res.status(200).json({
            success: true,
            data: {
                type,
                total,
                count: transactions.length,
                transactions,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Set or update wallet password
// @route   POST /api/wallet/password
// @access  Private
exports.setWalletPassword = async (req, res) => {
    try {
        const { password, newWalletPassword } = req.body;
        const userId = req.user._id;

        if (!password || !newWalletPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current account password and new wallet password'
            });
        }

        // Find user with password
        const user = await User.findById(userId).select('+password');
        
        // Verify account password first for security
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid account password'
            });
        }

        // Hash new wallet password
        const salt = await bcrypt.genSalt(10);
        const hashedWalletPassword = await bcrypt.hash(newWalletPassword, salt);

        // Update user
        user.walletPassword = hashedWalletPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Wallet password updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Check if user has a wallet password set
// @route   GET /api/wallet/password-status
// @access  Private
exports.getWalletPasswordStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+walletPassword');
        
        res.status(200).json({
            success: true,
            hasWalletPassword: !!user.walletPassword
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
