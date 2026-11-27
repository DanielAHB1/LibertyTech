const express = require('express');
const router = express.Router();
const { listarProductosVenta } = require('../controllers/ProductosController');

router.get('/', listarProductosVenta);

module.exports = router;