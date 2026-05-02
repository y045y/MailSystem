const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');

const { getCategories } = categoryController;

router.get('/', getCategories);

module.exports = router;
