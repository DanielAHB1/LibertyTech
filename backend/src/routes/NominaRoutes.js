const express = require('express');

const router = express.Router();

const NominaController = require('../controllers/NominaController');

// Generar una planilla quincenal.
router.post(
    '/generar',
    (req, res) => NominaController.generar(req, res)
);

// Consultar todas las planillas.
router.get(
    '/',
    (req, res) => NominaController.listar(req, res)
);

module.exports = router;