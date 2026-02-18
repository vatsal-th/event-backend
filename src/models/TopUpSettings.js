const mongoose = require('mongoose');

const topUpSettingsSchema = new mongoose.Schema({
    qrCode: {
        type: String,
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TopUpSettings', topUpSettingsSchema);
