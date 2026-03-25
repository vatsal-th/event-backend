const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
);

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/admin", require("./src/routes/adminTrainingRoutes"));
app.use("/api/admin", require("./src/routes/admin.routes"));
app.use("/api/complaints", require("./src/routes/complaintRoutes"));
app.use("/api/admin/complaints", require("./src/routes/adminComplaintRoutes"));
app.use("/api/training-apps", require("./src/routes/trainingRoutes"));
app.use("/api", require("./src/routes/user.routes"));
app.use("/api/hosting", require("./src/routes/hostingRoutes"));
app.use("/api/events", require("./src/routes/eventRoutes"));
app.use("/api/agency", require("./src/routes/agencyRoutes"));
app.use("/api/influencer", require("./src/routes/influencerRoutes"));
app.use("/api/referrals", require("./src/routes/referralRoutes"));
app.use("/api/wallet", require("./src/routes/walletRoutes"));
app.use("/api/bank-details", require("./src/routes/bankDetailsRoutes"));
app.use("/api/withdrawals", require("./src/routes/withdrawalRoutes"));
app.use("/api/topups", require("./src/routes/topUpRoutes"));
app.use("/api/salary", require("./src/routes/salaryRoutes"));
app.use("/api/recharge", require("./src/routes/rechargeRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));
app.use("/api/permissions", require("./src/routes/permissionRoutes"));

// Default Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🔥 Event API running on port ${PORT}`));
