const mongoose = require('mongoose');

const influencerApplicationSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    entryDate: {
        type: String,
        required: [true, 'Entry date is required'],
        trim: true
    },
    whatsAppNumber: {
        type: String,
        required: [true, 'WhatsApp number is required'],
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
    socialMediaId: {
        type: String,
        required: [true, 'Social Media ID is required'],
        trim: true
    },
    instagramFollowers: {
        type: String,
        required: [true, 'Instagram followers count is required'],
        trim: true
    },
    instagramLink: {
        type: String,
        required: [true, 'Instagram link is required'],
        trim: true
    },
    verificationStatus: {
        type: String,
        default: 'Yes'
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
    },
    rewardPoints: {
        type: Number,
        default: 0
    },
    isScratched: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('InfluencerApplication', influencerApplicationSchema);
