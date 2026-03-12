const User = require("../models/userModel");
const ActivityLog = require("../models/activityLogModel");
const bcrypt = require("bcryptjs");

// @desc    Add employee (Admin only)
// @route   POST /api/admin/addemployee
// @access  Private (Admin)
exports.addEmployee = async (req, res) => {
  const { fullName, email, password, gender, permissions } = req.body;

  if (!fullName || !email || !password || !gender || !permissions) {
    return res.status(400).json({ message: "Please add all fields" });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create employee
    const employee = await User.create({
      fullName,
      email,
      password: hashedPassword,
      gender: gender.toLowerCase(),
      role: "employee",
      permissions,
      createdBy: req.user._id,
    });

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: "Added Employee",
      details: `Added employee: ${employee.fullName} (${employee.email}) with permissions: ${permissions.join(", ")}`,
    });

    res.status(201).json({
      _id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      gender: employee.gender,
      permissions: employee.permissions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all employees (Admin only)
// @route   GET /api/admin/employees
// @access  Private (Admin)
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password");
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get activity logs (Admin only)
// @route   GET /api/admin/activitylogs
// @access  Private (Admin)
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate("user", "fullName email")
      .sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Promote user to admin (Admin only)
// @route   PUT /api/admin/promote/:userId
// @access  Private (Admin)
exports.promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "User is already an admin" });
    }

    user.role = "admin";
    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: "Promoted to Admin",
      details: `Promoted user: ${user.fullName} (${user.email}) to admin`,
    });

    res.status(200).json({
      message: "User promoted to admin successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit employee (Admin only)
// @route   PUT /api/admin/employee/:id
// @access  Private (Admin)
exports.editEmployee = async (req, res) => {
  const { fullName, email, gender, permissions } = req.body;

  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employee.role !== "employee") {
      return res.status(400).json({ message: "User is not an employee" });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== employee.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Update fields
    if (fullName) employee.fullName = fullName;
    if (email) employee.email = email;
    if (gender) employee.gender = gender.toLowerCase();
    if (permissions) employee.permissions = permissions;

    await employee.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: "Edited Employee",
      details: `Edited employee: ${employee.fullName} (${employee.email})`,
    });

    res.status(200).json({
      message: "Employee updated successfully",
      employee: {
        _id: employee._id,
        fullName: employee.fullName,
        email: employee.email,
        gender: employee.gender,
        permissions: employee.permissions,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete employee (Admin only)
// @route   DELETE /api/admin/employee/:id
// @access  Private (Admin)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employee.role !== "employee") {
      return res.status(400).json({ message: "User is not an employee" });
    }

    // Log activity before deleting
    await ActivityLog.create({
      user: req.user._id,
      action: "Deleted Employee",
      details: `Deleted employee: ${employee.fullName} (${employee.email})`,
    });

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users with basic info (Admin only)
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select(
      "fullName email points isWalletFrozen isActive createdAt",
    );
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Freeze/Unfreeze user wallet
// @route   PUT /api/admin/users/:userId/freeze
// @access  Private (Admin)
exports.freezeUserWallet = async (req, res) => {
  try {
    const { isFrozen } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.isWalletFrozen = isFrozen;
    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: isFrozen ? "Froze Wallet" : "Unfroze Wallet",
      details: `${isFrozen ? "Froze" : "Unfroze"} wallet for user: ${user.fullName} (${user.email})`,
    });

    res.status(200).json({
      success: true,
      message: `Wallet ${isFrozen ? "frozen" : "unfrozen"} successfully`,
      data: { isWalletFrozen: user.isWalletFrozen },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Adjust user balance (Add/Cut)
// @route   PUT /api/admin/users/:userId/balance
// @access  Private (Admin)
exports.adjustUserBalance = async (req, res) => {
  try {
    const { amount, action, reason } = req.body; // action: 'add' or 'cut'
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (action === "cut" && user.points < amount) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient balance to cut" });
    }

    const adjustment = action === "add" ? amount : -amount;
    user.points += adjustment;
    await user.save();

    // Create wallet transaction
    const WalletTransaction = require("../models/WalletTransaction");
    await WalletTransaction.create({
      userId: user._id,
      transactionType: "admin_adjustment",
      amount: adjustment,
      description: reason || `Admin balance adjustment (${action})`,
    });

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: "Adjusted Balance",
      details: `${action === "add" ? "Added" : "Cut"} ${amount} points for user: ${user.fullName} (${user.email}). Reason: ${reason || "N/A"}`,
    });

    res.status(200).json({
      success: true,
      message: `Balance adjusted successfully. New balance: ${user.points}`,
      data: { points: user.points },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin dashboard statistics (Overview)
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const HostingApplication = require("../models/HostingApplication");
    const EventApplication = require("../models/EventApplication");
    const AgencyApplication = require("../models/AgencyApplication");
    const InfluencerApplication = require("../models/InfluencerApplication");
    const WithdrawalRequest = require("../models/WithdrawalRequest");
    const WalletRecharge = require("../models/WalletRecharge");
    const TopUp = require("../models/TopUp");
    const Complaint = require("../models/complaintModel");

    const [
      userCount,
      employeeCount,
      hostingStats,
      eventStats,
      agencyStats,
      influencerStats,
      withdrawalStats,
      rechargeStats,
      topupStats,
      complaintStats,
      recentLogs,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "employee" }),

      // Applications
      HostingApplication.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      EventApplication.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      AgencyApplication.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      InfluencerApplication.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Financials
      WithdrawalRequest.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
      WalletRecharge.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
      TopUp.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),

      // Complaints
      Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      // Recent Activity
      ActivityLog.find()
        .populate("user", "fullName email")
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
    ]);

    // Helper to format aggregation results
    const formatStats = (stats) => {
      const result = { total: 0 };
      stats.forEach((s) => {
        const status = s._id ? s._id.toLowerCase() : "unknown";
        result[status] = s.count;
        result.total += s.count;
        if (s.totalAmount) {
          result[`${status}Amount`] = s.totalAmount;
        }
      });
      return result;
    };

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: userCount,
          employees: employeeCount,
        },
        applications: {
          hosting: formatStats(hostingStats),
          events: formatStats(eventStats),
          agency: formatStats(agencyStats),
          influencer: formatStats(influencerStats),
        },
        financials: {
          withdrawals: formatStats(withdrawalStats),
          recharges: formatStats(rechargeStats),
          topups: formatStats(topupStats),
        },
        complaints: formatStats(complaintStats),
        recentActivity: recentLogs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user active/inactive status
// @route   PUT /api/admin/users/:userId/status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.isActive = isActive;
    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: isActive ? "Activated User" : "Deactivated User",
      details: `${isActive ? "Activated" : "Deactivated"} account for user: ${user.fullName} (${user.email})`,
    });

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: { isActive: user.isActive },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

