const mongoose = require("mongoose");

const walletRechargeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    agentId: {
      type: String,
      required: true,
    },
    agentName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    rechargeType: {
      type: String,
      enum: ["Cash", "UPI", "NEFT"],
      required: true,
    },
    utrNumber: {
      type: String,
      required: true,
      unique: true,
    },
    paymentProof: {
      type: String, // URL/Path to image
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("WalletRecharge", walletRechargeSchema);
