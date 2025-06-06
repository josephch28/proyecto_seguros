const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, dashboardController.getDashboardData);

module.exports = router; 