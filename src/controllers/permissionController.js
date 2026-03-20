const ServicePermission = require("../models/ServicePermission");
const User = require("../models/userModel");

// @desc    Request permission for a service
// @route   POST /api/permissions/request
// @access  Private
exports.requestPermission = async (req, res) => {
  try {
    const { serviceName } = req.body;

    if (!["agency", "topup", "recharge"].includes(serviceName)) {
      return res.status(400).json({ success: false, message: "Invalid service name" });
    }

    // Check if a request already exists
    let permission = await ServicePermission.findOne({
      userId: req.user._id,
      serviceName,
    });

    if (permission) {
      if (permission.status === "Approved") {
        return res.status(400).json({ success: false, message: "Permission already approved" });
      }
      if (permission.status === "Pending") {
        return res.status(400).json({ success: false, message: "Request already pending" });
      }
      
      // If rejected, allow re-requesting (updating existing record)
      permission.status = "Pending";
      permission.rejectionReason = undefined;
      await permission.save();
    } else {
      permission = await ServicePermission.create({
        userId: req.user._id,
        serviceName,
      });
    }

    res.status(201).json({ success: true, data: permission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my permission statuses
// @route   GET /api/permissions/my
// @access  Private
exports.getMyPermissions = async (req, res) => {
  try {
    const permissions = await ServicePermission.find({ userId: req.user._id });
    res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all permission requests (Admin)
// @route   GET /api/permissions/admin/all
// @access  Private (Admin)
exports.getAllPermissionRequests = async (req, res) => {
  try {
    const requests = await ServicePermission.find()
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update permission status (Admin)
// @route   PUT /api/permissions/admin/:id
// @access  Private (Admin)
exports.updatePermissionStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const permission = await ServicePermission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    permission.status = status;
    if (status === "Rejected") {
      permission.rejectionReason = rejectionReason;
    } else {
      permission.approvedAt = Date.now();
      permission.rejectionReason = undefined;
    }

    await permission.save();

    res.status(200).json({ success: true, data: permission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
