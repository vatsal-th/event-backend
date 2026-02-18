const mongoose = require('mongoose');

const salaryDataSchema = new mongoose.Schema({
    talentId: { type: String, trim: true },
    nickname: { type: String, trim: true },
    duration: { type: String },
    validDay: { type: String },
    actualEar: { type: String },
    newTale: { type: String },
    crown: { type: String },
    lev: { type: String },
    revenue: { type: String },
    totalBeni: { type: String },
    gemsBal: { type: String },
    gemValue: { type: String },
    gemRefu: { type: String },
    gemExch: { type: String },
    gemCash: { type: String },
    basicSalary: { type: String },
    revenueBonus: { type: String },
    inrSalary: { type: String },
    carditDed: { type: String },
    totalPay: { type: String },
    joinDate: { type: String },
    country: { type: String },
    talentLev: { type: String },
    agencyId: { type: String },
    excellent: { type: String },
    paymentMethod: { type: String },
    bankName: { type: String },
    bankAccountNumber: { type: String },
    ifscCode: { type: String },
    email: { type: String },
    phone: { type: String },
    status: { type: String },
    pancard: { type: String },
    manager: { type: String },
    remark: { type: String },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    batchId: { type: String } // To group same CSV upload records
}, {
    timestamps: true
});

module.exports = mongoose.model('SalaryData', salaryDataSchema);
