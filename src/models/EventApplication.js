const mongoose = require('mongoose');

const eventApplicationSchema = new mongoose.Schema({
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    countryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        required: [true, 'Country is required']
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, 'Gender is required']
    },
    agencyCode: {
        type: String,
        required: [true, 'Agency code is required'],
        trim: true
    },
    budget: {
        type: String,
        required: [true, 'Budget is required'],
        trim: true
    },
    eventTime: {
        type: String,
        required: [true, 'Event time is required'],
        trim: true
    },
    eventDate: {
        type: String,
        required: [true, 'Event date is required'],
        trim: true
    },
    yourId: {
        type: String,
        trim: true
    },
    opponentId: {
        type: String,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    createdBy: {
        type: String,
        default: 'Automatic'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EventApplication', eventApplicationSchema);
