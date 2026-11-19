const express = require('express');
const router = express.Router();
const {
  listarcajas,
  cajaActiva,
  abrirCaja,
  cerrarCaja,
} = require('../controllers/CajaControllers');

router.get('/', listarcajas);
router.get('/activa/:id_sucursal', cajaActiva);
router.post('/abrir', abrirCaja);
router.put('/cerrar/:id_caja', cerrarCaja);

module.exports = router;