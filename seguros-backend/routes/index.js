const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const insuranceRoutes = require('./insuranceRoutes');
const contractRoutes = require('./contractRoutes');
const reimbursementRoutes = require('./reimbursementRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reembolsoRoutes = require('./reembolsoRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/insurances', insuranceRoutes);
router.use('/contracts', contractRoutes);
router.use('/reimbursements', reimbursementRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reembolsos', reembolsoRoutes);

module.exports = router; 