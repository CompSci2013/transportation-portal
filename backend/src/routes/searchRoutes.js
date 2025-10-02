const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Search aircraft with filters
router.get('/aircraft', searchController.searchAircraft);

// Get single aircraft by ID
router.get('/aircraft/:id', searchController.getAircraftById);

module.exports = router;
