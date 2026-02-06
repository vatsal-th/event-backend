const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/userModel');

// @desc    Get user's wallet transaction history
// @route   GET /api/wallet/transactions
// @access  Private
exports.getWalletTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get transactions with pagination
        const transactions = await WalletTransaction.find({ userId })
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
        };

        transactions.forEach(transaction => {
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
        });

        const totalEarned = stats.referralRewards + stats.applicationRewards + (stats.adminAdjustments > 0 ? stats.adminAdjustments : 0);
        const totalSpent = stats.withdrawals + (stats.adminAdjustments < 0 ? Math.abs(stats.adminAdjustments) : 0);

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
            .sort({ timestamp: -1 })
            .limit(50);

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
