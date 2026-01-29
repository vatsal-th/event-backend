const mongoose = require('mongoose');

const trainingVideoSchema = new mongoose.Schema({
    appId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainingApp',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    videoUrl: {
        type: String,
        required: true
    },
    duration: String,
    order: Number,
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TrainingVideo', trainingVideoSchema);
