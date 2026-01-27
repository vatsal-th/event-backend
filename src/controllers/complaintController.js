const Complaint = require('../models/complaintModel');
const ActivityLog = require('../models/activityLogModel');

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (User)
exports.createComplaint = async (req, res) => {
    const { title, description, type } = req.body;

    if (!title || !description || !type) {
        return res.status(400).json({ message: 'Please add title, description, and type' });
    }

    try {
        // Handle photo uploads
        const photos = req.files ? req.files.map(file => file.path) : [];

        const complaint = await Complaint.create({
            userId: req.user._id,
            title,
            description,
            type,
            photos,
        });

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Created Complaint',
            details: `Complaint No: ${complaint.complaintNo}`,
        });

        res.status(201).json({
            complaintNo: complaint.complaintNo,
            title: complaint.title,
            description: complaint.description,
            type: complaint.type,
            photos: complaint.photos,
            status: complaint.status,
            createdAt: complaint.createdAt,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's own complaints
// @route   GET /api/complaints/my
// @access  Private (User)
exports.getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single complaint (user's own)
// @route   GET /api/complaints/:id
// @access  Private (User)
exports.getComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        res.status(200).json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all complaints (Admin only)
// @route   GET /api/admin/complaints
// @access  Private (Admin)
exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('userId', 'fullName email')
            .populate('resolvedBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single complaint (Admin only)
// @route   GET /api/admin/complaints/:id
// @access  Private (Admin)
exports.getAdminComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('userId', 'fullName email')
            .populate('resolvedBy', 'fullName email');

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        res.status(200).json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resolve complaint (Admin only)
// @route   PUT /api/admin/complaints/:id/resolve
// @access  Private (Admin)
exports.resolveComplaint = async (req, res) => {
    const { resolutionNote } = req.body;

    if (!resolutionNote) {
        return res.status(400).json({ message: 'Please add resolution note' });
    }

    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        complaint.status = 'RESOLVED';
        complaint.resolutionNote = resolutionNote;
        complaint.resolvedBy = req.user._id;
        complaint.resolvedAt = new Date();

        await complaint.save();

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Resolved Complaint',
            details: `Complaint No: ${complaint.complaintNo}`,
        });

        res.status(200).json({
            message: 'Complaint resolved successfully',
            complaint,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};