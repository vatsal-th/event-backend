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
    text: {
      type: String,
      trim: true,
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

// Compound index to help with filtering/searching (no longer unique to allow history)
servicePermissionSchema.index({ userId: 1, serviceName: 1 });

module.exports = mongoose.model("ServicePermission", servicePermissionSchema);
