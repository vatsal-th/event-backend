const WalletRecharge = require("../models/WalletRecharge");
const User = require("../models/userModel");
const WalletTransaction = require("../models/WalletTransaction");
const ActivityLog = require("../models/activityLogModel");

// @desc    Submit a wallet recharge request
// @route   POST /api/wallet/recharge
// @access  Private (Agent)
exports.submitRechargeRequest = async (req, res) => {
  try {
    const { agentId, agentName, amount, rechargeType, utrNumber } = req.body;

    if (!agentId || !agentName || !amount || !rechargeType || !utrNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload payment slip" });
    }

    // Check if UTR already exists
    const utrExists = await WalletRecharge.findOne({ utrNumber });
    if (utrExists) {
      return res.status(400).json({
        success: false,
        message: "This UTR Number has already been submitted",
      });
    }

    const recharge = await WalletRecharge.create({
      userId: req.user._id,
      agentId,
      agentName,
      amount,
      rechargeType,
      utrNumber,
      paymentProof: req.file.path,
    });

    res.status(201).json({
      success: true,
      message:
        "Recharge request submitted successfully. Waiting for admin approval.",
      data: recharge,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's recharge history
// @route   GET /api/wallet/recharge/my
// @access  Private
exports.getMyRecharges = async (req, res) => {
  try {
    const recharges = await WalletRecharge.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: recharges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all recharge requests (Admin only)
// @route   GET /api/admin/recharges
// @access  Private (Admin)
exports.getAllRecharges = async (req, res) => {
  try {
    const recharges = await WalletRecharge.find()
      .populate("userId", "fullName email points")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: recharges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or Reject recharge request (Admin only)
// @route   PUT /api/admin/recharges/:id
// @access  Private (Admin)
exports.updateRechargeStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const recharge = await WalletRecharge.findById(req.params.id);

    if (!recharge) {
      return res
        .status(404)
        .json({ success: false, message: "Recharge request not found" });
    }

    if (recharge.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${recharge.status}`,
      });
    }

    if (status === "Approved") {
      // Check if user's wallet is frozen
      const user = await User.findById(recharge.userId);
      if (user && user.isWalletFrozen) {
        return res.status(400).json({
          success: false,
          message: "User wallet is frozen. Cannot approve recharge.",
        });
      }

      // Add points to user wallet
      await User.findByIdAndUpdate(recharge.userId, {
        $inc: { points: recharge.amount },
      });

      // Create Wallet Transaction
      await WalletTransaction.create({
        userId: recharge.userId,
        transactionType: "wallet_recharge",
        amount: recharge.amount,
        description: `Wallet Recharge Approved (UTR: ${recharge.utrNumber})`,
        relatedId: recharge._id,
        relatedModel: "WalletRecharge",
      });

      // Log Activity
      await ActivityLog.create({
        user: req.user._id,
        action: "Approved Wallet Recharge",
        details: `Approved ${recharge.amount} for User ID: ${recharge.userId}, UTR: ${recharge.utrNumber}`,
      });
    } else if (status === "Rejected") {
      // Log Activity
      await ActivityLog.create({
        user: req.user._id,
        action: "Rejected Wallet Recharge",
        details: `Rejected recharge request for User ID: ${recharge.userId}, UTR: ${recharge.utrNumber}`,
      });
    }

    recharge.status = status;
    recharge.adminNote = adminNote;
    recharge.processedBy = req.user._id;
    await recharge.save();

    res.status(200).json({
      success: true,
      message: `Recharge request ${status} successfully`,
      data: recharge,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
