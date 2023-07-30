const express = require('express');
const allRoutes = require('./allRoutes.routes.js');

const router = express.Router();

router.use(allRoutes);

module.exports = router;