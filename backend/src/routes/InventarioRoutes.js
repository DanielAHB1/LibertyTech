const express = require('express');
const router = express.Router();
const InventarioController = require('../controllers/InventarioController');

router.post('/descontar-venta', (req, res) => InventarioController.descontarPorVenta(req,res));
router.get('/estado', (req, res) => InventarioController.obtenerEstadoInventario(req,res));
router.get('/alertas', (req, res) => InventarioController.obtenerAlertas(req,res));

module.exports = router;
