const express = require("express");
const router = express.Router();
const {
  protect,
  authorizePermissions,
} = require("../middlewares/authMiddleware");
const {
  submitRechargeRequest,
  getMyRecharges,
  getAllRecharges,
  updateRechargeStatus,
} = require("../controllers/rechargeController");
const upload = require("../middlewares/uploadMiddleware");

// User / Agent Routes
router.post(
  "/submit",
  protect,
  upload.single("paymentProof"),
  submitRechargeRequest,
);
router.get("/my", protect, getMyRecharges);

// Admin Routes
router.get(
  "/admin/all",
  protect,
  authorizePermissions("recharge_approval"),
  getAllRecharges,
);
router.put(
  "/admin/update/:id",
  protect,
  authorizePermissions("recharge_approval"),
  updateRechargeStatus,
);

module.exports = router;
