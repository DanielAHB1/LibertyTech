const express = require('express');
const router = express.Router();
const InventarioController = require('../controllers/InventarioController');

router.post('/descontar-venta', (req, res) => InventarioController.descontarPorVenta(req,res));
router.get('/estado', (req, res) => InventarioController.obtenerEstadoInventario(req,res));
router.get('/alertas', (req, res) => InventarioController.obtenerAlertas(req,res));
router.post('/insumos', (req, res) => InventarioController.crearInsumo(req, res));
router.get('/elaborados', (req, res) => InventarioController.obtenerProductosElaborados(req, res));
router.get('/recetas/:idProducto', (req, res) => InventarioController.obtenerReceta(req, res));
router.post('/recetas/insumo', (req, res) => InventarioController.guardarInsumoreceta(req, res));
router.delete('/recetas/insumo/:idReceta', (req, res) => InventarioController.eliminarInsumoReceta(req, res));

module.exports = router;
