const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
    appName: {
        type: String,
        required: [true, 'App name is required'],
        unique: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('App', appSchema);
