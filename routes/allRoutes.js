const express = require('express');
const { AllService } = require('../service/index.js');

const router = express.Router();

router.get('/cities', AllService.getAllCitiesData);
router.get('/cities?city:name', AllService.getCityData);
router.get('/swell/:cityCode/dia/:days', AllService.getSwellData);
router.get('/weather', AllService.getCurrentCapitalWeatherdata);

module.exports = router;