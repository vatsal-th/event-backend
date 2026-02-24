const mongoose = require("mongoose");

const adminPaymentMethodSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["UPI", "NEFT", "SCANNER"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // UPI specific fields
    upiId: {
      type: String,
      trim: true,
    },
    // NEFT specific fields
    accountHolderName: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    ifscCode: {
      type: String,
      trim: true,
    },
    // Scanner specific fields
    qrCode: {
      type: String, // URL/Path to image
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("AdminPaymentMethod", adminPaymentMethodSchema);
