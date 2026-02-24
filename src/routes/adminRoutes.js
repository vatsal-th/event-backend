const express = require("express");
const router = express.Router();
const {
  addEmployee,
  getEmployees,
  getActivityLogs,
  promoteToAdmin,
  editEmployee,
  deleteEmployee,
  getAllUsers,
  freezeUserWallet,
  adjustUserBalance,
  getAdminDashboardStats,
} = require("../controllers/adminController");
const { protect, authorizeAdmin } = require("../middlewares/authMiddleware");

router.post("/addemployee", protect, authorizeAdmin, addEmployee);
router.get("/employees", protect, authorizeAdmin, getEmployees);
router.put("/employee/:id", protect, authorizeAdmin, editEmployee);
router.delete("/employee/:id", protect, authorizeAdmin, deleteEmployee);
router.get("/activitylogs", protect, authorizeAdmin, getActivityLogs);
router.put("/promote/:userId", protect, authorizeAdmin, promoteToAdmin);

// Dashboard Stats
router.get("/dashboard/stats", protect, authorizeAdmin, getAdminDashboardStats);

// Wallet Management Routes
router.get("/users", protect, authorizeAdmin, getAllUsers);
router.put("/users/:userId/freeze", protect, authorizeAdmin, freezeUserWallet);
router.put(
  "/users/:userId/balance",
  protect,
  authorizeAdmin,
  adjustUserBalance,
);

module.exports = router;
