const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    gender: {
        type: String,
        enum: ['male', 'female', 'non-binary'],
        required: [true, 'Please select a gender'],
    },
    role: {
        type: String,
        enum: ['admin', 'employee', 'user'],
        default: 'user',
    },
    permissions: [{
        type: String,
        enum: ['apply_event', 'bank_approval', 'accept_event', 'hosting', 'manage_users', 'manage_payments', 'view_reports'],
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    points: {
        type: Number,
        default: 0,
    },
    inviteId: {
        type: String,
        unique: true,
        sparse: true,
    },
    walletPassword: {
        type: String,
        select: false,
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
