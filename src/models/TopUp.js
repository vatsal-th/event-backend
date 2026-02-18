const mongoose = require('mongoose');

const topUpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    appId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App',
        required: [true, 'App is required'],
    },
    targetUserId: {
        type: String,
        required: [true, 'Target User ID is required'],
    },
    targetUserName: {
        type: String,
        required: [true, 'Target User Name is required'],
    },
    amount: {
        type: Number,
        required: [true, 'Top-up amount is required'],
        min: [1, 'Minimum amount is 1'],
    },
    paymentMethod: {
        type: String,
        enum: ['Main Wallet', 'Cash'],
        default: 'Main Wallet',
    },
    utrNumber: {
        type: String,
    },
    paymentProof: {
        type: String,
    },
    walletType: {
        type: String,
        default: 'Main Wallet',
    },
    agentCode: {
        type: String,
        required: [true, 'Agent Code is required'],
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    processedAt: {
        type: Date,
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalletTransaction',
    }
}, {
    timestamps: true,
});

// Index for performance
topUpSchema.index({ userId: 1, status: 1 });
topUpSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('TopUp', topUpSchema);
