const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { fullName, email, password, confirmPassword, gender, referralCode } =
    req.body;

  if (!fullName || !email || !password || !confirmPassword || !gender) {
    return res.status(400).json({ message: "Please add all fields" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check if there are any admins
    const adminCount = await User.countDocuments({ role: "admin" });
    const role = adminCount === 0 ? "admin" : "user";

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique invite ID for the new user
    const { generateInviteId } = require("../utils/referralHelper");
    const inviteId = await generateInviteId();

    // Create user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      gender: gender.toLowerCase(),
      role,
      inviteId,
    });

    // Process referral if referral code was provided
    let referralMessage = "";
    if (referralCode && referralCode.trim() !== "") {
      const { processReferral } = require("../utils/referralHelper");
      const referralResult = await processReferral(
        referralCode.trim().toUpperCase(),
        user._id,
      );

      if (referralResult.success) {
        referralMessage = ` Referral code applied! Rewards will be issued after your first service approval.`;
      }
      // Note: We don't fail registration if referral code is invalid
    }

    if (user) {
      res.status(201).json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        gender: user.gender,
        role: user.role,
        permissions: user.permissions,
        inviteId: user.inviteId,
        token: generateToken(user._id),
        message: `User registered successfully!${referralMessage}`,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.isActive === false) {
        return res.status(403).json({
          message: "Your account is inactive",
        });
      }
      res.json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate an admin
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is admin or employee
    if (user.role !== "admin" && user.role !== "employee") {
      return res
        .status(403)
        .json({
          message: "Access denied. Only admins and employees can login here.",
        });
    }

    // Validate password
    if (await bcrypt.compare(password, user.password)) {
      if (user.isActive === false) {
        return res.status(403).json({
          message: "Your account is inactive",
        });
      }
      res.json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL.split(",")[0];
    const resetUrl = `${frontendUrl}/resetpassword/${resetToken}`;

    const message = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
                </div>
                <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <p>Hello,</p>
                    <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                    <p style="font-size: 14px; color: #666; word-break: break-all;">Or click regarding this link: <a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a></p>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
                    <p>&copy; ${new Date().getFullYear()} Event Backend. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        message,
      });

      res.status(200).json({ success: true, data: "Email Sent" });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid Token" });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      data: "Password Reset Success",
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    fullName: req.user.fullName,
    email: req.user.email,
    gender: req.user.gender,
    role: req.user.role,
    permissions: req.user.permissions,
    inviteId: req.user.inviteId,
    points: req.user.points,
  });
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  const fieldsToUpdate = {
    fullName: req.body.fullName,
    email: req.body.email,
    gender: req.body.gender ? req.body.gender.toLowerCase() : undefined,
  };

  try {
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
