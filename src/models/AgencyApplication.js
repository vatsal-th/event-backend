const mongoose = require('mongoose');

const agencyApplicationSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
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
    agencyName: {
        type: String,
        required: [true, 'Agency name is required'],
        trim: true
    },
    minHostRequirement: {
        type: String,
        required: [true, 'Minimum host requirement is required'],
        trim: true
    },
    appId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App',
        required: [true, 'App name is required']
    },
    inviterId: {
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

module.exports = mongoose.model('AgencyApplication', agencyApplicationSchema);
