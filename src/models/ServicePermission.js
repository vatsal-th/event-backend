const mongoose = require("mongoose");

const servicePermissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceName: {
      type: String,
      enum: ["agency", "topup", "recharge"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user can have only one request per service (or track history differently if needed)
// For now, let's allow unique userId + serviceName combination to track the latest state or manage re-requests
servicePermissionSchema.index({ userId: 1, serviceName: 1 }, { unique: true });

module.exports = mongoose.model("ServicePermission", servicePermissionSchema);
