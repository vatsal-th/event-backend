const mongoose = require('mongoose');

const trainingAppSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
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

module.exports = mongoose.model('TrainingApp', trainingAppSchema);
