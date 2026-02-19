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
const { protect, authorizePermissions } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Country routes
router.post('/country', protect, authorizePermissions('content_manage'), addCountry);
router.get('/countries', protect, authorizePermissions('content_manage'), getAllCountries);
router.put('/country/:id', protect, authorizePermissions('content_manage'), updateCountry);
router.delete('/country/:id', protect, authorizePermissions('content_manage'), deleteCountry);

// Category routes
router.post('/category', protect, authorizePermissions('content_manage'), addCategory);
router.get('/categories', protect, authorizePermissions('content_manage'), getAllCategories);
router.put('/category/:id', protect, authorizePermissions('content_manage'), updateCategory);
router.delete('/category/:id', protect, authorizePermissions('content_manage'), deleteCategory);

// App routes
router.post('/app', protect, authorizePermissions('content_manage'), addApp);
router.get('/apps', protect, authorizePermissions('content_manage'), getAllApps);
router.put('/app/:id', protect, authorizePermissions('content_manage'), updateApp);
router.delete('/app/:id', protect, authorizePermissions('content_manage'), deleteApp);

module.exports = router;
