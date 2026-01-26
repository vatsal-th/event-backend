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
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
