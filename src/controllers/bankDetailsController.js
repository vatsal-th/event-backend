const BankDetails = require('../models/BankDetails');

// @desc    Add or update user's bank details
// @route   POST /api/bank-details
// @access  Private
exports.addOrUpdateBankDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const { accountHolderName, bankName, accountNumber, ifscCode, branch, accountType } = req.body;

        // Validate required fields
        if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: accountHolderName, bankName, accountNumber, ifscCode'
            });
        }

        // Check if bank details already exist
        let bankDetails = await BankDetails.findOne({ userId });

        if (bankDetails) {
            // Update existing bank details
            bankDetails.accountHolderName = accountHolderName;
            bankDetails.bankName = bankName;
            bankDetails.accountNumber = accountNumber;
            bankDetails.ifscCode = ifscCode.toUpperCase();
            bankDetails.branch = branch || bankDetails.branch;
            bankDetails.accountType = accountType || bankDetails.accountType;
            bankDetails.status = 'pending'; // Reset status on update
            bankDetails.isVerified = false; // Reset verification on update
            bankDetails.rejectionReason = undefined; // Clear previous rejection reason

            await bankDetails.save();

            res.status(200).json({
                success: true,
                message: 'Bank details updated successfully and sent for re-verification',
                data: bankDetails,
            });
        } else {
            // Create new bank details
            bankDetails = await BankDetails.create({
                userId,
                accountHolderName,
                bankName,
                accountNumber,
                ifscCode: ifscCode.toUpperCase(),
                branch,
                accountType: accountType || 'savings',
                status: 'pending',
            });

            res.status(201).json({
                success: true,
                message: 'Bank details added successfully and sent for verification',
                data: bankDetails,
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user's bank details
// @route   GET /api/bank-details
// @access  Private
exports.getBankDetails = async (req, res) => {
    try {
        const userId = req.user._id;

        const bankDetails = await BankDetails.findOne({ userId });

        if (!bankDetails) {
            return res.status(404).json({
                success: false,
                message: 'No bank details found. Please add your bank details first.'
            });
        }

        res.status(200).json({
            success: true,
            data: bankDetails,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete user's bank details
// @route   DELETE /api/bank-details
// @access  Private
exports.deleteBankDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const WithdrawalRequest = require('../models/WithdrawalRequest');

        // Check if there are any pending withdrawal requests
        const pendingWithdrawals = await WithdrawalRequest.countDocuments({
            userId,
            status: 'pending'
        });

        if (pendingWithdrawals > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete bank details. You have pending withdrawal requests.'
            });
        }

        const bankDetails = await BankDetails.findOneAndDelete({ userId });

        if (!bankDetails) {
            return res.status(404).json({
                success: false,
                message: 'No bank details found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bank details deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== ADMIN ENDPOINTS ====================

// @desc    Get all bank details requests (Admin)
// @route   GET /api/bank-details/admin/all
// @access  Private (Admin only)
exports.getAllBankDetails = async (req, res) => {
    try {
        const { isVerified, status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) {
            filter.status = status;
        } else if (isVerified !== undefined) {
            filter.status = isVerified === 'true' ? 'approved' : 'pending';
        }

        const bankDetails = await BankDetails.find(filter)
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await BankDetails.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                bankDetails,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalRecords: totalCount,
                    recordsPerPage: parseInt(limit),
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify/Approve/Reject bank details (Admin)
// @route   PUT /api/bank-details/admin/:id/verify
// @access  Private (Admin only)
exports.verifyBankDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body; // status: 'approved' or 'rejected'

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid status (approved/rejected)'
            });
        }

        if (status === 'rejected' && (!rejectionReason || rejectionReason.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required when rejecting bank details'
            });
        }

        const updateData = {
            status,
            isVerified: status === 'approved',
            rejectionReason: status === 'rejected' ? rejectionReason : undefined
        };

        const bankDetails = await BankDetails.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('userId', 'fullName email');

        if (!bankDetails) {
            return res.status(404).json({
                success: false,
                message: 'Bank details not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Bank details ${status} successfully`,
            data: bankDetails,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
