const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Withdrawal amount is required'],
        min: [100, 'Minimum withdrawal amount is 100 points'],
    },
    bankDetailsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankDetails',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    requestedAt: {
        type: Date,
        default: Date.now,
    },
    processedAt: {
        type: Date,
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    rejectionReason: {
        type: String,
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalletTransaction',
    },
}, {
    timestamps: true,
});

// Indexes for faster queries
withdrawalRequestSchema.index({ userId: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
