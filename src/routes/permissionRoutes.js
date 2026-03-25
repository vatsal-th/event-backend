const express = require("express");
const router = express.Router();
const {
  requestPermission,
  getMyPermissions,
  getAllPermissionRequests,
  updatePermissionStatus,
} = require("../controllers/permissionController");
const { protect, authorizeAdmin } = require("../middlewares/authMiddleware");

// User routes
router.post("/request", protect, requestPermission);
router.get("/my", protect, getMyPermissions);

// Admin routes
router.get("/admin/all", protect, authorizeAdmin, getAllPermissionRequests);
router.put("/admin/:id", protect, authorizeAdmin, updatePermissionStatus);

module.exports = router;
