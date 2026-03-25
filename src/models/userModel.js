const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    gender: {
      type: String,
      enum: ["male", "female", "non-binary"],
      required: [true, "Please select a gender"],
    },
    role: {
      type: String,
      enum: ["admin", "employee", "user"],
      default: "user",
    },
    permissions: [
      {
        type: String,
        enum: [
          "hosting_approval",
          "event_approval",
          "agency_approval",
          "influencer_approval",
          "topup_approval",
          "complaints_manage",
          "training_manage",
          "content_manage",
          "bank_manage",
          "withdrawal_manage",
          "manage_users",
          "view_reports",
          "recharge_approval",
        ],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    points: {
      type: Number,
      default: 0,
    },
    inviteId: {
      type: String,
      unique: true,
      sparse: true,
    },
    walletPassword: {
      type: String,
      select: false,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isWalletFrozen: {
      type: Boolean,
      default: false,
    },
    lastNotificationViewedAt: {
      type: Date,
      default: Date.now,
    },
    lastServiceViewedAt: {
      type: Date,
      default: Date.now,
    },
    lastSystemViewedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
