const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    transactionType: {
        type: String,
        enum: ['referral_reward', 'application_reward', 'withdrawal', 'admin_adjustment', 'withdrawal_refund'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel',
    },
    relatedModel: {
        type: String,
        enum: ['ReferralLog', 'EventApplication', 'HostingApplication', 'AgencyApplication', 'InfluencerApplication', 'User', 'WithdrawalRequest', 'TopUp'],
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index for faster queries
walletTransactionSchema.index({ userId: 1, timestamp: -1 });
walletTransactionSchema.index({ transactionType: 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
