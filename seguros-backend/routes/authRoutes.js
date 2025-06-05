const express = require('express');
const router = express.Router();
const { login, verify } = require('../controllers/authController');
const { validateLoginInput } = require('../middlewares/validationMiddleware');

// Ruta de login
router.post('/login', validateLoginInput, login);

// Ruta de verificación
router.get('/verify', verify);

module.exports = router;
