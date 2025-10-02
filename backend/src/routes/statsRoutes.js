const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Get aggregate statistics
router.get('/statistics', statsController.getStatistics);

module.exports = router;
