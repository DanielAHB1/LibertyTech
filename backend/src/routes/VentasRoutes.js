const express = require('express');
const router = express.Router();
const {
  MostrarVentas,
  VentaId,
  registrarVenta,
} = require('../controllers/VentaController');

router.get('/', MostrarVentas);
router.get('/:id_venta', VentaId);
router.post('/', registrarVenta);

module.exports = router;