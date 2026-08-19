const express = require('express');
const router = express.Router();
const { uploadMedia } = require('../controllers/uploadController');

router.post('/', uploadMedia);

module.exports = router;
