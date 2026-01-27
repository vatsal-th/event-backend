const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    complaintNo: {
        type: String,
        unique: true,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['Payment Issue', 'Technical Issue', 'Account Issue', 'Other'],
        default: 'Other',
        required: [true, 'Please select a complaint type'],
    },
    photos: [{
        type: String,
    }],
    status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED'],
        default: 'PENDING',
    },
    resolutionNote: {
        type: String,
        trim: true,
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    resolvedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Auto-generate complaintNo before validation
complaintSchema.pre('validate', async function () {
    if (this.isNew) {
        // Generate unique complaint number: timestamp + random 4-digit number
        const timestamp = Date.now();
        const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
        this.complaintNo = `COMP-${timestamp}-${random}`;
    }
});

module.exports = mongoose.model('Complaint', complaintSchema);