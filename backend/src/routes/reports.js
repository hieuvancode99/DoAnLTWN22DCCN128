const express = require('express');
const router = express.Router();
const { exportReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');

router.get('/export', protect, exportReport);

module.exports = router;
