const SalaryData = require('../models/SalaryData');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// @desc    Upload Salary CSV
// @route   POST /api/salary/upload
// @access  Private (Admin)
exports.uploadSalaryCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
        }

        const results = [];
        const batchId = Date.now().toString(); // Simple batch ID to group entries

const { Readable } = require('stream');

        // Create a readable stream from buffer
        const stream = Readable.from(req.file.buffer.toString());

        stream
            .pipe(csv({ strip: true })) // 'strip' option trims headers/values automatically if supported, or we rely on our logic
            .on('data', (data) => {
                // Debug: Log the first row's keys to understand what the parser sees
                if (results.length === 0) {
                     console.log('CSV Raw Headers detected:', Object.keys(data));
                }

                // Helper to safely get value from data object
                const getValue = (keys) => {
                    if (!Array.isArray(keys)) keys = [keys];
                    const dataKeys = Object.keys(data);
                    
                    for (const key of keys) {
                        // 1. Exact match
                        if (data[key] !== undefined) return data[key].trim();
                        
                        // 2. Case-insensitive & Trimmed match
                        const match = dataKeys.find(k => k.trim().toLowerCase() === key.trim().toLowerCase());
                        if (match) return data[match].trim();
                        
                        // 3. Partial match (useful for long headers like Duration)
                        const partial = dataKeys.find(k => k.toLowerCase().includes(key.toLowerCase()));
                        if (partial) return data[partial].trim();
                    }
                    return '';
                };

                const mappedData = {
                    talentId: getValue(['Talent ID', 'talent_id']),
                    nickname: getValue(['Nickname']),
                    duration: getValue(['Duration']),
                    validDay: getValue(['Valid Day']),
                    actualEar: getValue(['Actual Earning', 'Actual Ear']),
                    newTale: getValue(['New Talents Offers', 'New Tale']),
                    crown: getValue(['Crown Level', 'Crown']),
                    lev: getValue(['Revenue Extra Bonus', 'Lev']),
                    revenue: getValue(['Revenue($)', 'Revenue']),
                    totalBeni: getValue(['Total Bonus', 'Total Beni']),
                    gemsBal: getValue(['Gems Balance', 'Gems Bal']),
                    gemValue: getValue(['Gem Value($)', 'Gem Valu']),
                    gemRefu: getValue(['Gem Refund', 'Gem Refu']),
                    gemExch: getValue(['Gem exchange', 'Gem exch']),
                    gemCash: getValue(['Gem cashout', 'Gem cash']),
                    basicSalary: getValue(['Basic Salary($)', 'Basic Sala']),
                    revenueBonus: getValue(['Excellent Talent Reward($)', 'Revenue I']),
                    inrSalary: getValue(['INR Salary']),
                    carditDed: getValue(['cardit deduction', 'cardit ded']),
                    totalPay: getValue(['total pay']),
                    joinDate: getValue(['Join Date']),
                    country: getValue(['Country']),
                    talentLev: getValue(['Talent Level', 'Talent Lev']),
                    agencyId: getValue(['Agency ID']),
                    excellent: getValue(['Excellent Talent Reward($)', 'Excellent']),
                    paymentMethod: getValue(['Payment Type', 'Payment Method', 'Payment']),
                    bankName: getValue(['Bank Name']),
                    bankAccountNumber: getValue(['Bank Account', 'Bank Acco']),
                    ifscCode: getValue(['ifc code', 'ifsc code']),
                    email: getValue(['Email']),
                    phone: getValue(['Phone']),
                    status: getValue(['Status']),
                    pancard: getValue(['pancard']),
                    manager: getValue(['Manager']),
                    remark: getValue(['Remark']),
                    uploadedBy: req.user._id,
                    batchId: batchId
                };

                // Validate: Only add if at least Talent ID or Nickname exists to prevent empty rows
                if (mappedData.talentId || mappedData.nickname) {
                    results.push(mappedData);
                }
            })
            .on('end', async () => {
                try {
                    // Bulk insert for better performance
                    await SalaryData.insertMany(results);
                    
                    res.status(201).json({
                        success: true,
                        message: `${results.length} salary records imported successfully`,
                        batchId: batchId
                    });
                } catch (err) {
                    res.status(500).json({ success: false, message: 'Error saving records: ' + err.message });
                }
            })
            .on('error', (error) => {
                res.status(500).json({ success: false, message: 'Error parsing CSV: ' + error.message });
            });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all salary records with pagination
// @route   GET /api/salary/records
// @access  Private (Admin)
exports.getSalaryRecords = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const records = await SalaryData.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await SalaryData.countDocuments();

        res.status(200).json({
            success: true,
            data: records,
            pagination: {
                total: totalCount,
                page,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a batch or all records (Optional utility)
// @route   DELETE /api/salary/records
// @access  Private (Admin)
exports.clearSalaryRecords = async (req, res) => {
    try {
        const { batchId } = req.query;
        if (batchId) {
            await SalaryData.deleteMany({ batchId });
        } else {
            await SalaryData.deleteMany({});
        }
        res.status(200).json({ success: true, message: 'Records deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Search salary by Talent ID (User/Public)
// @route   GET /api/salary/search
// @access  Protected (User)
exports.searchUserSalary = async (req, res) => {
    try {
        const { talentId } = req.query;

        if (!talentId) {
            return res.status(400).json({ success: false, message: 'Please provide a Talent ID' });
        }

        // Case-insensitive search for flexibility
        // Using regex for exact match but case insensitive
        const salaryRecord = await SalaryData.findOne({ 
            talentId: { $regex: new RegExp(`^${talentId.trim()}$`, 'i') } 
        }).sort({ createdAt: -1 }); // Get the latest if duplicates exist

        if (!salaryRecord) {
            return res.status(404).json({ success: false, message: 'No salary record found for this Talent ID' });
        }

        res.status(200).json({
            success: true,
            data: salaryRecord
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
