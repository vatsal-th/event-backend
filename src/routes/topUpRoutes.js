const express = require("express");
const router = express.Router();
const {
  protect,
  authorizePermissions,
} = require("../middlewares/authMiddleware");
const {
  createTopUp,
  getUserTopUps,
  getAllTopUps,
  updateTopUpStatus,
  getApps,
  updateTopUpQR,
  getTopUpQR,
  deleteTopUpQR,
  addPaymentMethod,
  getAllAdminPaymentMethods,
  updatePaymentMethod,
  deletePaymentMethod,
  getActivePaymentMethods,
} = require("../controllers/topUpController");
const upload = require("../middlewares/uploadMiddleware");

// User Routes
router.get("/apps", protect, getApps);
router.get("/qr", protect, getTopUpQR);
router.post("/create", protect, upload.single("paymentProof"), createTopUp);
router.get("/history", protect, getUserTopUps);
router.get("/payment-methods", protect, getActivePaymentMethods);

// Admin Routes
router.post(
  "/admin/qr",
  protect,
  authorizePermissions("content_manage"),
  upload.single("qrCode"),
  updateTopUpQR,
);
router.delete(
  "/admin/qr",
  protect,
  authorizePermissions("content_manage"),
  deleteTopUpQR,
);
router.get(
  "/admin/all",
  protect,
  authorizePermissions("topup_approval"),
  getAllTopUps,
);
router.put(
  "/admin/update/:id",
  protect,
  authorizePermissions("topup_approval"),
  updateTopUpStatus,
);

// New Payment Methods Admin Routes
router.post(
  "/admin/payment-methods",
  protect,
  authorizePermissions("content_manage"),
  upload.single("qrCode"),
  addPaymentMethod,
);
router.get(
  "/admin/payment-methods",
  protect,
  authorizePermissions("content_manage"),
  getAllAdminPaymentMethods,
);
router.put(
  "/admin/payment-methods/:id",
  protect,
  authorizePermissions("content_manage"),
  upload.single("qrCode"),
  updatePaymentMethod,
);
router.delete(
  "/admin/payment-methods/:id",
  protect,
  authorizePermissions("content_manage"),
  deletePaymentMethod,
);

module.exports = router;
