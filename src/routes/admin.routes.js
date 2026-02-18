const express = require('express');
const router = express.Router();
const {
    addCountry,
    getAllCountries,
    updateCountry,
    deleteCountry,
    addCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    addApp,
    getAllApps,
    updateApp,
    deleteApp
} = require('../controllers/admin.controller');
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Country routes
router.post('/country', protect, authorizeAdmin, addCountry);
router.get('/countries', protect, authorizeAdmin, getAllCountries);
router.put('/country/:id', protect, authorizeAdmin, updateCountry);
router.delete('/country/:id', protect, authorizeAdmin, deleteCountry);

// Category routes
router.post('/category', protect, authorizeAdmin, addCategory);
router.get('/categories', protect, authorizeAdmin, getAllCategories);
router.put('/category/:id', protect, authorizeAdmin, updateCategory);
router.delete('/category/:id', protect, authorizeAdmin, deleteCategory);

// App routes
router.post('/app', protect, authorizeAdmin, addApp);
router.get('/apps', protect, authorizeAdmin, getAllApps);
router.put('/app/:id', protect, authorizeAdmin, updateApp);
router.delete('/app/:id', protect, authorizeAdmin, deleteApp);

module.exports = router;
