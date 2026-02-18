const mongoose = require('mongoose');

const referralLogSchema = new mongoose.Schema({
    referrerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    referredUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    inviteCode: {
        type: String,
        required: true,
    },
    rewardPoints: {
        type: Number,
        default: 10,
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index for faster queries
referralLogSchema.index({ referrerId: 1 });
referralLogSchema.index({ referredUserId: 1 });

module.exports = mongoose.model('ReferralLog', referralLogSchema);
