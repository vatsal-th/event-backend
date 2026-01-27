const User = require('../models/userModel');
const ActivityLog = require('../models/activityLogModel');
const bcrypt = require('bcryptjs');

// @desc    Add employee (Admin only)
// @route   POST /api/admin/addemployee
// @access  Private (Admin)
exports.addEmployee = async (req, res) => {
    const { fullName, email, password, gender, permissions } = req.body;

    if (!fullName || !email || !password || !gender || !permissions) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    try {
        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create employee
        const employee = await User.create({
            fullName,
            email,
            password: hashedPassword,
            gender: gender.toLowerCase(),
            role: 'employee',
            permissions,
            createdBy: req.user._id,
        });

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Added Employee',
            details: `Added employee: ${employee.fullName} (${employee.email}) with permissions: ${permissions.join(', ')}`,
        });

        res.status(201).json({
            _id: employee.id,
            fullName: employee.fullName,
            email: employee.email,
            gender: employee.gender,
            permissions: employee.permissions,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all employees (Admin only)
// @route   GET /api/admin/employees
// @access  Private (Admin)
exports.getEmployees = async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee' }).select('-password');
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get activity logs (Admin only)
// @route   GET /api/admin/activitylogs
// @access  Private (Admin)
exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find().populate('user', 'fullName email').sort({ timestamp: -1 });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Promote user to admin (Admin only)
// @route   PUT /api/admin/promote/:userId
// @access  Private (Admin)
exports.promoteToAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ message: 'User is already an admin' });
        }

        user.role = 'admin';
        await user.save();

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Promoted to Admin',
            details: `Promoted user: ${user.fullName} (${user.email}) to admin`,
        });

        res.status(200).json({
            message: 'User promoted to admin successfully',
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Edit employee (Admin only)
// @route   PUT /api/admin/employee/:id
// @access  Private (Admin)
exports.editEmployee = async (req, res) => {
    const { fullName, email, gender, permissions } = req.body;

    try {
        const employee = await User.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (employee.role !== 'employee') {
            return res.status(400).json({ message: 'User is not an employee' });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== employee.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        // Update fields
        if (fullName) employee.fullName = fullName;
        if (email) employee.email = email;
        if (gender) employee.gender = gender.toLowerCase();
        if (permissions) employee.permissions = permissions;

        await employee.save();

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Edited Employee',
            details: `Edited employee: ${employee.fullName} (${employee.email})`,
        });

        res.status(200).json({
            message: 'Employee updated successfully',
            employee: {
                _id: employee._id,
                fullName: employee.fullName,
                email: employee.email,
                gender: employee.gender,
                permissions: employee.permissions,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete employee (Admin only)
// @route   DELETE /api/admin/employee/:id
// @access  Private (Admin)
exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await User.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (employee.role !== 'employee') {
            return res.status(400).json({ message: 'User is not an employee' });
        }

        // Log activity before deleting
        await ActivityLog.create({
            user: req.user._id,
            action: 'Deleted Employee',
            details: `Deleted employee: ${employee.fullName} (${employee.email})`,
        });

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: 'Employee deleted successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};