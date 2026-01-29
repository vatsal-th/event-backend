const Country = require('../models/Country');
const Category = require('../models/Category');
const App = require('../models/App');
const ActivityLog = require('../models/activityLogModel');

// ============= COUNTRY CRUD =============

// @desc    Add country (Admin only)
// @route   POST /api/admin/country
// @access  Private (Admin)
exports.addCountry = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Country name is required' });
    }

    try {
        const country = await Country.create({ name: name.trim() });

        await ActivityLog.create({
            user: req.user._id,
            action: 'Added Country',
            details: `Added country: ${country.name}`,
        });

        res.status(201).json({
            success: true,
            message: 'Country added successfully',
            data: country
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Country already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all countries (Admin only)
// @route   GET /api/admin/countries
// @access  Private (Admin)
exports.getAllCountries = async (req, res) => {
    try {
        const countries = await Country.find().sort({ name: 1 });
        res.status(200).json({
            success: true,
            count: countries.length,
            data: countries
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update country (Admin only)
// @route   PUT /api/admin/country/:id
// @access  Private (Admin)
exports.updateCountry = async (req, res) => {
    const { name, status } = req.body;

    try {
        const country = await Country.findById(req.params.id);

        if (!country) {
            return res.status(404).json({ message: 'Country not found' });
        }

        if (name) country.name = name.trim();
        if (status) country.status = status;

        await country.save();

        await ActivityLog.create({
            user: req.user._id,
            action: 'Updated Country',
            details: `Updated country: ${country.name}`,
        });

        res.status(200).json({
            success: true,
            message: 'Country updated successfully',
            data: country
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Country name already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete country (Admin only)
// @route   DELETE /api/admin/country/:id
// @access  Private (Admin)
exports.deleteCountry = async (req, res) => {
    try {
        const country = await Country.findById(req.params.id);

        if (!country) {
            return res.status(404).json({ message: 'Country not found' });
        }

        await ActivityLog.create({
            user: req.user._id,
            action: 'Deleted Country',
            details: `Deleted country: ${country.name}`,
        });

        await Country.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Country deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============= CATEGORY CRUD =============

// @desc    Add category (Admin only)
// @route   POST /api/admin/category
// @access  Private (Admin)
exports.addCategory = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        const category = await Category.create({ name: name.trim() });

        await ActivityLog.create({
            user: req.user._id,
            action: 'Added Category',
            details: `Added category: ${category.name}`,
        });

        res.status(201).json({
            success: true,
            message: 'Category added successfully',
            data: category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all categories (Admin only)
// @route   GET /api/admin/categories
// @access  Private (Admin)
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update category (Admin only)
// @route   PUT /api/admin/category/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res) => {
    const { name, status } = req.body;

    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (name) category.name = name.trim();
        if (status) category.status = status;

        await category.save();

        await ActivityLog.create({
            user: req.user._id,
            action: 'Updated Category',
            details: `Updated category: ${category.name}`,
        });

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category name already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete category (Admin only)
// @route   DELETE /api/admin/category/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await ActivityLog.create({
            user: req.user._id,
            action: 'Deleted Category',
            details: `Deleted category: ${category.name}`,
        });

        await Category.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============= APP CRUD =============

// @desc    Add app (Admin only)
// @route   POST /api/admin/app
// @access  Private (Admin)
exports.addApp = async (req, res) => {
    const { appName } = req.body;

    if (!appName) {
        return res.status(400).json({ message: 'App name is required' });
    }

    try {
        const app = await App.create({ appName: appName.trim() });

        await ActivityLog.create({
            user: req.user._id,
            action: 'Added App',
            details: `Added app: ${app.appName}`,
        });

        res.status(201).json({
            success: true,
            message: 'App added successfully',
            data: app
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'App already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all apps (Admin only)
// @route   GET /api/admin/apps
// @access  Private (Admin)
exports.getAllApps = async (req, res) => {
    try {
        const apps = await App.find().sort({ appName: 1 });

        res.status(200).json({
            success: true,
            count: apps.length,
            data: apps
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update app (Admin only)
// @route   PUT /api/admin/app/:id
// @access  Private (Admin)
exports.updateApp = async (req, res) => {
    const { appName, status } = req.body;

    try {
        const app = await App.findById(req.params.id);

        if (!app) {
            return res.status(404).json({ message: 'App not found' });
        }

        if (appName) app.appName = appName.trim();
        if (status) app.status = status;

        await app.save();

        await ActivityLog.create({
            user: req.user._id,
            action: 'Updated App',
            details: `Updated app: ${app.appName}`,
        });

        res.status(200).json({
            success: true,
            message: 'App updated successfully',
            data: app
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'App name already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete app (Admin only)
// @route   DELETE /api/admin/app/:id
// @access  Private (Admin)
exports.deleteApp = async (req, res) => {
    try {
        const app = await App.findById(req.params.id);

        if (!app) {
            return res.status(404).json({ message: 'App not found' });
        }

        await ActivityLog.create({
            user: req.user._id,
            action: 'Deleted App',
            details: `Deleted app: ${app.appName}`,
        });

        await App.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'App deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


