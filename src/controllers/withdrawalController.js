const WithdrawalRequest = require("../models/WithdrawalRequest");
const BankDetails = require("../models/BankDetails");
const User = require("../models/userModel");
const WalletTransaction = require("../models/WalletTransaction");

// ==================== USER ENDPOINTS ====================

// @desc    Create withdrawal request
// @route   POST /api/withdrawals
// @access  Private
exports.createWithdrawalRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, walletPassword } = req.body;

    // Check if user's wallet is frozen
    if (req.user.isWalletFrozen) {
      return res.status(403).json({
        success: false,
        message: "Your wallet is frozen. Cannot perform withdrawals.",
      });
    }

    // Validate amount
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Minimum withdrawal amount is 100 points",
      });
    }

    // Wallet Password verification
    const userWithPassword =
      await User.findById(userId).select("+walletPassword");

    if (!userWithPassword.walletPassword) {
      return res.status(400).json({
        success: false,
        message: "Please set a wallet password before making a withdrawal",
      });
    }

    if (!walletPassword) {
      return res.status(400).json({
        success: false,
        message: "Wallet password is required to complete this transaction",
      });
    }

    const isMatch = await require("bcryptjs").compare(
      walletPassword,
      userWithPassword.walletPassword,
    );
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect wallet password",
      });
    }

    // Check if user has sufficient balance
    if (req.user.points < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You have ${req.user.points} points available.`,
      });
    }

    // Check if user has bank details
    const bankDetails = await BankDetails.findOne({ userId });
    if (!bankDetails) {
      return res.status(400).json({
        success: false,
        message: "Please add your bank details before requesting withdrawal",
      });
    }

    // Check if user already has a pending withdrawal
    const pendingWithdrawal = await WithdrawalRequest.findOne({
      userId,
      status: "pending",
    });

    if (pendingWithdrawal) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending withdrawal request. Please wait for it to be processed.",
      });
    }

    // Find the admin to receive the points
    const admin = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });
    if (!admin) {
      return res.status(500).json({
        success: false,
        message: "No admin found to process withdrawal",
      });
    }

    // Deduct points from user
    await User.findByIdAndUpdate(userId, {
      $inc: { points: -amount },
    });

    // Add points to admin
    await User.findByIdAndUpdate(admin._id, {
      $inc: { points: amount },
    });

    // Create withdrawal request
    const withdrawal = await WithdrawalRequest.create({
      userId,
      amount,
      bankDetailsId: bankDetails._id,
    });

    // Create wallet transaction for user
    const userWalletTransaction = await WalletTransaction.create({
      userId: userId,
      transactionType: "withdrawal",
      amount: -amount,
      description: `Withdrawal request created - ${amount} points to admin balance`,
      relatedId: withdrawal._id,
      relatedModel: "WithdrawalRequest",
    });

    // Create wallet transaction for admin
    await WalletTransaction.create({
      userId: admin._id,
      transactionType: "admin_adjustment",
      amount: amount,
      description: `Received points from user withdrawal - User: ${req.user.fullName} (${userId})`,
      relatedId: withdrawal._id,
      relatedModel: "WithdrawalRequest",
    });

    // Update withdrawal with transaction ID
    withdrawal.transactionId = userWalletTransaction._id;
    await withdrawal.save();

    const populatedWithdrawal = await WithdrawalRequest.findById(withdrawal._id)
      .populate("bankDetailsId")
      .populate("userId", "fullName email");

    const adminBankDetails = await BankDetails.findOne({ userId: admin._id });

    res.status(201).json({
      success: true,
      message:
        "Withdrawal request created successfully and points transferred to admin",
      data: populatedWithdrawal,
      adminDetails: {
        fullName: admin.fullName,
        email: admin.email,
        points: admin.points,
        bankDetails: adminBankDetails || "No bank details added by admin",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's withdrawal history
// @route   GET /api/withdrawals
// @access  Private
exports.getUserWithdrawals = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const withdrawals = await WithdrawalRequest.find({ userId })
      .populate("bankDetailsId")
      .populate("processedBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await WithdrawalRequest.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalRecords: totalCount,
          recordsPerPage: limit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get specific withdrawal status
// @route   GET /api/withdrawals/:id
// @access  Private
exports.getWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if user's wallet is frozen
    if (req.user.isWalletFrozen) {
      return res.status(403).json({
        success: false,
        message: "Your wallet is frozen. Cannot view withdrawal status.",
      });
    }

    const withdrawal = await WithdrawalRequest.findOne({ _id: id, userId })
      .populate("bankDetailsId")
      .populate("processedBy", "fullName email");

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found",
      });
    }

    res.status(200).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== ADMIN ENDPOINTS ====================

// @desc    Get all withdrawal requests (Admin)
// @route   GET /api/admin/withdrawals
// @access  Private (Admin only)
exports.getAllWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const withdrawals = await WithdrawalRequest.find(filter)
      .populate("userId", "fullName email points")
      .populate("bankDetailsId")
      .populate("processedBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await WithdrawalRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        withdrawals,
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
      message: error.message,
    });
  }
};

// @desc    Approve withdrawal request (Admin)
// @route   PUT /api/admin/withdrawals/:id/approve
// @access  Private (Admin only)
exports.approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const withdrawal = await WithdrawalRequest.findById(id).populate(
      "userId",
      "fullName email points",
    );

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Withdrawal is already ${withdrawal.status}`,
      });
    }

    // Update withdrawal request
    withdrawal.status = "approved";
    withdrawal.processedAt = Date.now();
    withdrawal.processedBy = adminId;
    await withdrawal.save();

    const updatedWithdrawal = await WithdrawalRequest.findById(id)
      .populate("userId", "fullName email points")
      .populate("bankDetailsId")
      .populate("processedBy", "fullName email");

    res.status(200).json({
      success: true,
      message: "Withdrawal approved successfully",
      data: updatedWithdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reject withdrawal request (Admin)
// @route   PUT /api/admin/withdrawals/:id/reject
// @access  Private (Admin only)
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const withdrawal = await WithdrawalRequest.findById(id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Withdrawal is already ${withdrawal.status}`,
      });
    }

    // Find the admin who received the points (main admin)
    const mainAdmin = await User.findOne({ role: "admin" }).sort({
      createdAt: 1,
    });

    if (mainAdmin) {
      // Deduct points back from admin
      await User.findByIdAndUpdate(mainAdmin._id, {
        $inc: { points: -withdrawal.amount },
      });

      // Create transaction for admin
      await WalletTransaction.create({
        userId: mainAdmin._id,
        transactionType: "admin_adjustment",
        amount: -withdrawal.amount,
        description: `Withdrawal rejected - points returned to user from admin balance`,
        relatedId: withdrawal._id,
        relatedModel: "WithdrawalRequest",
      });
    }

    // Refund points to user
    await User.findByIdAndUpdate(withdrawal.userId, {
      $inc: { points: withdrawal.amount },
    });

    // Create refund transaction for user
    await WalletTransaction.create({
      userId: withdrawal.userId,
      transactionType: "withdrawal_refund",
      amount: withdrawal.amount,
      description: `Withdrawal rejected - points refunded. Reason: ${reason}`,
      relatedId: withdrawal._id,
      relatedModel: "WithdrawalRequest",
    });

    // Update withdrawal request
    withdrawal.status = "rejected";
    withdrawal.processedAt = Date.now();
    withdrawal.processedBy = adminId;
    withdrawal.rejectionReason = reason;
    await withdrawal.save();

    const updatedWithdrawal = await WithdrawalRequest.findById(id)
      .populate("userId", "fullName email points")
      .populate("bankDetailsId")
      .populate("processedBy", "fullName email");

    res.status(200).json({
      success: true,
      message: "Withdrawal rejected successfully",
      data: updatedWithdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get withdrawal statistics (Admin)
// @route   GET /api/admin/withdrawals/stats
// @access  Private (Admin only)
exports.getWithdrawalStats = async (req, res) => {
  try {
    const [pending, approved, rejected, totalApprovedAmount] =
      await Promise.all([
        WithdrawalRequest.countDocuments({ status: "pending" }),
        WithdrawalRequest.countDocuments({ status: "approved" }),
        WithdrawalRequest.countDocuments({ status: "rejected" }),
        WithdrawalRequest.aggregate([
          { $match: { status: "approved" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

    const recentWithdrawals = await WithdrawalRequest.find()
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        totalApprovedAmount: totalApprovedAmount[0]?.total || 0,
        recentWithdrawals,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
