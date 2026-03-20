const ServicePermission = require("../models/ServicePermission");
const User = require("../models/userModel");

// @desc    Request permission for a service
// @route   POST /api/permissions/request
// @access  Private
exports.requestPermission = async (req, res) => {
  try {
    const { serviceName, text } = req.body;

    if (!["agency", "topup", "recharge"].includes(serviceName)) {
      return res.status(400).json({ success: false, message: "Invalid service name" });
    }

    // Check if already approved
    const existingApproved = await ServicePermission.findOne({
      userId: req.user._id,
      serviceName,
      status: "Approved",
    });

    if (existingApproved) {
      return res.status(400).json({ success: false, message: "Permission already approved" });
    }

    // Always create a new record to maintain history as requested by the user
    const permission = await ServicePermission.create({
      userId: req.user._id,
      serviceName,
      text,
    });

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
    const permissions = await ServicePermission.aggregate([
      { $match: { userId: req.user._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$serviceName",
          latestRequest: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$latestRequest" } },
      { $sort: { createdAt: -1 } } // Sort the unique results too
    ]);

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
    const { status, startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Status filter
    if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
      filter.status = status;
    }

    // Date filter
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : new Date(startDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          filter.createdAt = { $gte: start, $lte: end };
        }
      }
    }

    const requests = await ServicePermission.find(filter)
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await ServicePermission.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalRecords: totalCount,
          recordsPerPage: limit,
        },
      },
    });
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
