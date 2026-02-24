const TopUp = require("../models/TopUp");
const ActivityLog = require("../models/activityLogModel");
const App = require("../models/App");
const User = require("../models/userModel");
const WalletTransaction = require("../models/WalletTransaction");
const TopUpSettings = require("../models/TopUpSettings");
const AdminPaymentMethod = require("../models/AdminPaymentMethod");
const bcrypt = require("bcryptjs");

// ==================== SETTINGS (ADMIN) ====================

// @desc    Update Top-Up QR Code (Admin only)
// @route   POST /api/topups/admin/qr
// @access  Private (Admin)
exports.updateTopUpQR = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload a photo" });
    }

    let settings = await TopUpSettings.findOne();
    if (settings) {
      settings.qrCode = req.file.path;
      settings.updatedBy = req.user._id;
      await settings.save();
    } else {
      settings = await TopUpSettings.create({
        qrCode: req.file.path,
        updatedBy: req.user._id,
      });
    }

    res.status(200).json({
      success: true,
      message: "Top-up QR code updated successfully",
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Top-Up QR Code (Admin only)
// @route   DELETE /api/topups/admin/qr
// @access  Private (Admin)
exports.deleteTopUpQR = async (req, res) => {
  try {
    const settings = await TopUpSettings.findOne();
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "QR code settings not found" });
    }

    await TopUpSettings.deleteOne({ _id: settings._id });

    res.status(200).json({
      success: true,
      message: "Top-up QR code deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ADMIN PAYMENT METHODS ====================

// @desc    Add a payment method (Admin only)
// @route   POST /api/topups/admin/payment-methods
// @access  Private (Admin)
exports.addPaymentMethod = async (req, res) => {
  try {
    const {
      type,
      title,
      upiId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
    } = req.body;

    const methodData = {
      type,
      title,
      upiId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      createdBy: req.user._id,
    };

    if (type === "SCANNER") {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Please upload a QR code image" });
      }
      methodData.qrCode = req.file.path;
    }

    const method = await AdminPaymentMethod.create(methodData);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: "Added Payment Method",
      details: `Added ${type}: ${title}`,
    });

    res.status(201).json({
      success: true,
      message: "Payment method added successfully",
      data: method,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all payment methods (Admin only)
// @route   GET /api/topups/admin/payment-methods
// @access  Private (Admin)
exports.getAllAdminPaymentMethods = async (req, res) => {
  try {
    const methods = await AdminPaymentMethod.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: methods,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a payment method (Admin only)
// @route   PUT /api/topups/admin/payment-methods/:id
// @access  Private (Admin)
exports.updatePaymentMethod = async (req, res) => {
  try {
    const {
      type,
      title,
      upiId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      status,
    } = req.body;
    const method = await AdminPaymentMethod.findById(req.params.id);

    if (!method) {
      return res
        .status(404)
        .json({ success: false, message: "Payment method not found" });
    }

    method.type = type || method.type;
    method.title = title || method.title;
    method.upiId = upiId || method.upiId;
    method.accountHolderName = accountHolderName || method.accountHolderName;
    method.bankName = bankName || method.bankName;
    method.accountNumber = accountNumber || method.accountNumber;
    method.ifscCode = ifscCode || method.ifscCode;
    method.status = status || method.status;

    if (req.file) {
      method.qrCode = req.file.path;
    }

    await method.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: "Updated Payment Method",
      details: `Updated ${method.type}: ${method.title}`,
    });

    res.status(200).json({
      success: true,
      message: "Payment method updated successfully",
      data: method,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a payment method (Admin only)
// @route   DELETE /api/topups/admin/payment-methods/:id
// @access  Private (Admin)
exports.deletePaymentMethod = async (req, res) => {
  try {
    const method = await AdminPaymentMethod.findById(req.params.id);
    if (!method) {
      return res
        .status(404)
        .json({ success: false, message: "Payment method not found" });
    }

    await AdminPaymentMethod.deleteOne({ _id: method._id });

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: "Deleted Payment Method",
      details: `Deleted ${method.type}: ${method.title}`,
    });

    res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== USER (AGENT) ENDPOINTS ====================

// @desc    Get active payment methods for users
// @route   GET /api/topups/payment-methods
// @access  Private
exports.getActivePaymentMethods = async (req, res) => {
  try {
    const methods = await AdminPaymentMethod.find({ status: "active" }).sort({
      type: 1,
    });
    res.status(200).json({
      success: true,
      data: methods,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Top-Up QR Code (Legacy support)
// @route   GET /api/topups/qr
// @access  Private
exports.getTopUpQR = async (req, res) => {
  try {
    const settings = await TopUpSettings.findOne();
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "QR code not found" });
    }
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active apps for top-up selection
// @route   GET /api/topup/apps
// @access  Private
exports.getApps = async (req, res) => {
  try {
    const apps = await App.find({ status: "active" }).select("appName");
    res.status(200).json({
      success: true,
      data: apps,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a top-up request (Points move to Admin)
// @route   POST /api/topup
// @access  Private
exports.createTopUp = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user's wallet is frozen
    if (req.user.isWalletFrozen) {
      return res.status(403).json({
        success: false,
        message: "Your wallet is frozen. Cannot perform top-ups.",
      });
    }

    const {
      amount,
      appId,
      targetUserId,
      targetUserName,
      walletPassword,
      paymentMethod,
      utrNumber,
      agentCode,
      walletType,
    } = req.body;

    // Basic Validation
    if (
      !appId ||
      !targetUserId ||
      !targetUserName ||
      !amount ||
      !agentCode ||
      !walletPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields including wallet password are required",
      });
    }

    if (paymentMethod === "Cash") {
      if (!utrNumber || !req.file) {
        return res.status(400).json({
          success: false,
          message:
            "UTR Number and payment proof photo are required for Cash payments",
        });
      }
    }

    // Verify App exists
    const app = await App.findById(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: "Selected app not found",
      });
    }

    // 1. Verify Wallet Password
    const userWithPassword =
      await User.findById(userId).select("+walletPassword");
    if (!userWithPassword.walletPassword) {
      return res.status(400).json({
        success: false,
        message: "Please set a wallet password before performing a top-up",
      });
    }

    const isMatch = await bcrypt.compare(
      walletPassword,
      userWithPassword.walletPassword,
    );
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect wallet password",
      });
    }

    // 2. Check Sufficient Balance (Only if using Main Wallet)
    if (paymentMethod === "Main Wallet") {
      if (req.user.points < amount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. You have ${req.user.points} points.`,
        });
      }
    }

    // 3. Find Admin to receive points
    const admin = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });
    if (!admin) {
      return res.status(500).json({
        success: false,
        message: "Admin account not found",
      });
    }

    // 4. Verification Check (Fast fail)
    if (paymentMethod === "Main Wallet") {
      if (req.user.points < amount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. You have ${req.user.points} points.`,
        });
      }
    }

    // 5. Create TopUp Record
    const topUp = await TopUp.create({
      userId,
      appId,
      targetUserId,
      targetUserName,
      amount,
      paymentMethod: paymentMethod || "Main Wallet",
      utrNumber:
        utrNumber ||
        (paymentMethod === "Main Wallet" || paymentMethod === "Online"
          ? `WAL-${Math.floor(100000 + Math.random() * 900000)}`
          : undefined),
      paymentProof:
        paymentMethod === "Cash" && req.file ? req.file.path : undefined,
      walletType: walletType || "Main Wallet",
      agentCode,
      status: "Pending",
    });

    // 6. Record Wallet Transactions - Removed from here, now handled on approval
    await topUp.save();

    const isWallet = paymentMethod === "Main Wallet";
    res.status(201).json({
      success: true,
      message: isWallet
        ? "Top-up submitted. Points will be deducted from your wallet upon admin approval."
        : "Top-up submitted successfully. Waiting for admin approval.",
      data: topUp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current user's top-up history
// @route   GET /api/topup/history
// @access  Private
exports.getUserTopUps = async (req, res) => {
  try {
    const topUps = await TopUp.find({ userId: req.user._id })
      .populate("appId", "appName")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: topUps,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ADMIN ENDPOINTS ====================

// @desc    Get all top-up requests for admin
// @route   GET /api/admin/topups
// @access  Private (Admin)
exports.getAllTopUps = async (req, res) => {
  try {
    const topUps = await TopUp.find()
      .populate("userId", "fullName email points")
      .populate("appId", "appName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: topUps,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Reject Top-Up (for status tracking)
// @route   PUT /api/admin/topups/:id
// @access  Private (Admin)
exports.updateTopUpStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const topUp = await TopUp.findById(req.params.id);

    if (!topUp) {
      return res
        .status(404)
        .json({ success: false, message: "Top-up request not found" });
    }

    if (topUp.status !== "Pending") {
      return res
        .status(400)
        .json({ success: false, message: `Request already ${topUp.status}` });
    }

    if (status === "Approved") {
      const method = topUp.paymentMethod
        ? topUp.paymentMethod.toLowerCase()
        : "";

      // Transfer Points only on approval for Main Wallet
      if (method === "main wallet") {
        const user = await User.findById(topUp.userId);
        if (!user || user.points < topUp.amount) {
          return res.status(400).json({
            success: false,
            message: "User has insufficient balance to approve this top-up",
          });
        }

        // 1. Deduct from User
        await User.findByIdAndUpdate(topUp.userId, {
          $inc: { points: -topUp.amount },
        });

        const app = await App.findById(topUp.appId);

        // 2. Create User Transaction
        const userTx = await WalletTransaction.create({
          userId: topUp.userId,
          transactionType: "withdrawal",
          amount: -topUp.amount,
          description: `Top-Up Approved - App: ${app ? app.appName : "N/A"}, Target: ${topUp.targetUserId}`,
          relatedId: topUp._id,
          relatedModel: "TopUp",
        });

        topUp.transactionId = userTx._id;

        // 3. Add to Admin
        const admin = await User.findOne({ role: "admin" }).sort({
          createdAt: 1,
        });
        if (admin) {
          await User.findByIdAndUpdate(admin._id, {
            $inc: { points: topUp.amount },
          });

          // 4. Create Admin Transaction
          await WalletTransaction.create({
            userId: admin._id,
            transactionType: "admin_adjustment",
            amount: topUp.amount,
            description: `Top-Up Approved - Received points from ${user.fullName}`,
            relatedId: topUp._id,
            relatedModel: "TopUp",
          });
        }
      } else if (method === "cash" || method === "online") {
        // For external payments, no point deduction needed, just mark as approved
      }
    } else if (status === "Rejected") {
      // On rejection, nothing to refund as nothing was deducted for Main Wallet
    }

    topUp.status = status;
    topUp.processedBy = req.user._id;
    topUp.processedAt = Date.now();
    await topUp.save();

    res.status(200).json({
      success: true,
      message: `Top-up ${status} successfully`,
      data: topUp,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
